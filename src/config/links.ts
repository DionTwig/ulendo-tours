// Centralised outbound links. Swap real values here when the client supplies them —
// nowhere else in the codebase should hardcode a URL.
export const links = {
  whatsapp: {
    base: "https://wa.me/27XXXXXXXXX",
    flights: "?text=Hi%20Ulendo%2C%20I'm%20looking%20for%20flights.",
    stays: "?text=Hi%20Ulendo%2C%20I%20need%20accommodation.",
    experiences: "?text=Hi%20Ulendo%2C%20I'm%20planning%20a%20trip.",
    nights: "?text=Hi%20Ulendo%2C%20I%20want%20to%20know%20more%20about%20Ulendo%20Nights.",
    packages: "?text=Hi%20Ulendo%2C%20I'm%20interested%20in%20the%20Cape%20Town%20Long%20Weekend%20package.",
    general: "?text=Hi%20Ulendo%2C%20I'd%20like%20to%20plan%20something.",
  },
  viator: "#",
  instagram: "#",
  email: "mailto:hello@ulendotours.co.za",
} as const;

type WhatsappIntent = Exclude<keyof typeof links.whatsapp, "base">;

export function whatsapp(intent: WhatsappIntent): string {
  return `${links.whatsapp.base}${links.whatsapp[intent]}`;
}

export const isPending = (url: string) => url === "#";
