/** @deprecated для кольорів краще useAppTheme(); spacing / radius без змін */
import { spacing, radius, makeTheme } from './palette';

export const theme = makeTheme(false);
export { spacing, radius, makeTheme };
