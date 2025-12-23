import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  serwis: {
    title: "Serwis",
    links: [
      { label: "Porównaj oferty", href: "/" },
      { label: "Wszyscy operatorzy", href: "/dostawcy-internetu" },
      { label: "Mapa zasięgu", href: "/mapa" },
      { label: "Ranking operatorów", href: "/ranking" },
      { label: "Blog", href: "/blog" },
    ],
  },
  popularne: {
    title: "Popularne miasta",
    links: [
      { label: "Internet Warszawa", href: "/internet/warszawa" },
      { label: "Internet Kraków", href: "/internet/krakow" },
      { label: "Internet Wrocław", href: "/internet/wroclaw" },
      { label: "Internet Poznań", href: "/internet/poznan" },
      { label: "Internet Gdańsk", href: "/internet/gdansk" },
      { label: "Internet Łódź", href: "/internet/lodz" },
    ],
  },
  informacje: {
    title: "Informacje",
    links: [
      { label: "O nas", href: "/o-nas" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Regulamin", href: "/regulamin" },
      { label: "Polityka prywatności", href: "/polityka-prywatnosci" },
      { label: "Dla operatorów", href: "/dla-operatorow" },
    ],
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo i opis */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/dostawcyinternetu-logo-biale.webp"
                alt="DostawcyInternetu.pl"
                width={180}
                height={32}
                className="h-7 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Porównujemy oferty internetu od wszystkich operatorów w Polsce. 
              Sprawdź dostępność światłowodu, kabla i LTE pod Twoim adresem.
            </p>
            {/* Social */}
            <div className="flex gap-2">
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Linki - 3 kolumny */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-white font-semibold mb-4 text-sm">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-500">
              © {currentYear} DostawcyInternetu.pl
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Aktualizacja: grudzień 2024</span>
              <a href="/kontakt" className="hover:text-white transition-colors">
                Zgłoś błąd
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
