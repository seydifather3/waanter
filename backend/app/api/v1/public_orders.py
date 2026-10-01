import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderRead

router = APIRouter(prefix="/public/shops", tags=["public-orders"])


def _get_active_shop_or_404(db: Session, slug: str) -> Shop:
    shop = (
        db.query(Shop)
        .filter(Shop.slug == slug, Shop.status == "active")
        .first()
    )
    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Boutique introuvable",
        )
    return shop


def _get_or_create_customer(
    db: Session, shop: Shop, name: str, phone: str, address: str | None
) -> Customer:
    customer = (
        db.query(Customer)
        .filter(Customer.shop_id == shop.id, Customer.phone == phone)
        .first()
    )
    if customer is not None:
        # Met a jour le nom et l'adresse si le client les a changes
        customer.name = name
        if address:
            customer.address = address
        return customer

    customer = Customer(shop_id=shop.id, name=name, phone=phone, address=address)
    db.add(customer)
    db.flush()  # pour obtenir customer.id avant le commit final
    return customer


@router.post(
    "/{slug}/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED
)
def create_public_order(
    slug: str, payload: OrderCreate, db: Session = Depends(get_db)
):
    """
    Cree une commande pour la boutique publique identifiee par son slug.
    Le total est TOUJOURS recalcule cote serveur a partir des prix reels
    en base. Les prix envoyes par le client, s'il y en avait, seraient ignores.
    """
    shop = _get_active_shop_or_404(db, slug)

    # Recupere tous les produits demandes en une seule requete,
    # en verifiant au passage qu'ils appartiennent bien a ce shop.
    product_ids = [item.product_id for item in payload.items]
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids), Product.shop_id == shop.id)
        .all()
    )
    products_by_id = {p.id: p for p in products}

    order_items_data = []
    total = 0

    for item in payload.items:
        product = products_by_id.get(item.product_id)

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Produit introuvable pour cette boutique",
            )
        if not product.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le produit '{product.name}' n'est plus disponible",
            )
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuffisant pour '{product.name}' "
                f"(disponible : {product.stock})",
            )

        subtotal = product.price * item.quantity
        total += subtotal

        order_items_data.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": product.price,
                "subtotal": subtotal,
            }
        )

    # Tout ce qui suit s'execute dans une seule transaction :
    # soit la commande et ses lignes sont toutes enregistrees,
    # soit rien ne l'est en cas d'erreur.
    try:
        customer = _get_or_create_customer(
            db,
            shop,
            payload.customer_name,
            payload.customer_phone,
            payload.delivery_address,
        )

        order = Order(
            shop_id=shop.id,
            customer_id=customer.id,
            total=total,
            delivery_method=payload.delivery_method,
            delivery_address=payload.delivery_address,
        )
        db.add(order)
        db.flush()  # pour obtenir order.id

        for item_data in order_items_data:
            db.add(OrderItem(order_id=order.id, **item_data))

        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de creer la commande",
        )

    items_read = (
        db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    )

    return OrderRead(
        id=order.id,
        shop_id=order.shop_id,
        customer_id=order.customer_id,
        total=order.total,
        status=order.status,
        payment_status=order.payment_status,
        delivery_status=order.delivery_status,
        delivery_method=order.delivery_method,
        delivery_address=order.delivery_address,
        items=[
            {
                "id": i.id,
                "product_id": i.product_id,
                "product_name": i.product_name,
                "quantity": i.quantity,
                "unit_price": i.unit_price,
                "subtotal": i.subtotal,
            }
            for i in items_read
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )