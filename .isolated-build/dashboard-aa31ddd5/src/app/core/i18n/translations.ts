import { ar as authAr } from '../../../../public/in18/auth/ar';
import { en as authEn } from '../../../../public/in18/auth/en';
import { ar as homeAr } from '../../../../public/in18/dashboard/ar';
import { en as homeEn } from '../../../../public/in18/dashboard/en';
import { ar as profileAr } from '../../../../public/in18/profile/ar';
import { en as profileEn } from '../../../../public/in18/profile/en';
import { ar as sectionsAr } from '../../../../public/in18/sections/ar';
import { en as sectionsEn } from '../../../../public/in18/sections/en';
import { ar as seoAr } from '../../../../public/in18/seo/ar';
import { en as seoEn } from '../../../../public/in18/seo/en';
import { ar as settingsAr } from '../../../../public/in18/settings/ar';
import { en as settingsEn } from '../../../../public/in18/settings/en';
import { ar as usersAr } from '../../../../public/in18/users/ar';
import { en as usersEn } from '../../../../public/in18/users/en';
import { ar as layoutAr } from '../../../../public/in18/layout/ar';
import { en as layoutEn } from '../../../../public/in18/layout/en';
import { ar as commonAr } from '../../../../public/in18/shared/ar';
import { en as commonEn } from '../../../../public/in18/shared/en';
import { ar as productsAr } from '../../../../public/in18/products/ar';
import { en as productsEn } from '../../../../public/in18/products/en';
import { ar as projectsAr } from '../../../../public/in18/projects/ar';
import { en as projectsEn } from '../../../../public/in18/projects/en';
import { ar as servicesAr } from '../../../../public/in18/services/ar';
import { en as servicesEn } from '../../../../public/in18/services/en';

import { mergeTranslations, zipTranslations } from './merge';

export type { AppLanguage } from './language';

export const TRANSLATIONS = mergeTranslations(
  zipTranslations(commonAr, commonEn),
  zipTranslations(layoutAr, layoutEn),
  zipTranslations(authAr, authEn),
  zipTranslations(homeAr, homeEn),
  zipTranslations(profileAr, profileEn),
  zipTranslations(usersAr, usersEn),
  zipTranslations(settingsAr, settingsEn),
  zipTranslations(sectionsAr, sectionsEn),
  zipTranslations(seoAr, seoEn),
  zipTranslations(productsAr, productsEn),
  zipTranslations(projectsAr, projectsEn),
  zipTranslations(servicesAr, servicesEn),
);
