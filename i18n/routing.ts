import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pl', 'ua', 'en'],
  defaultLocale: 'pl',
  localePrefix: {
    mode: 'as-needed',  // PL bez prefiksu, UA/EN z prefiksem
  }
});

export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);