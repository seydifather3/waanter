export async function shareOrCopy(url: string, title: string): Promise<"shared" | "copied"> {
  // Sur mobile, ouvre le menu de partage natif du telephone
  // (WhatsApp, Facebook, Instagram, SMS, etc.)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch {
      // L'utilisateur a annule le partage, ou le navigateur a refuse :
      // on se rabat silencieusement sur la copie du lien.
    }
  }

  // Sur ordinateur, ou si le partage natif n'est pas disponible,
  // on copie simplement le lien dans le presse-papiers.
  await navigator.clipboard.writeText(url);
  return "copied";
}