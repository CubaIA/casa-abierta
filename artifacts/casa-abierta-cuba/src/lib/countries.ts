export interface Country {
  id: string;
  code: string;
  name: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const COUNTRIES: Country[] = [
  { id: 'cu', code: 'CU', name: 'Cuba' },
  { id: 'mx', code: 'MX', name: 'México' },
  { id: 'es', code: 'ES', name: 'España' },
  { id: 'fr', code: 'FR', name: 'Francia' },
  { id: 'us', code: 'US', name: 'Estados Unidos' },
  { id: 'ca', code: 'CA', name: 'Canadá' },
  { id: 'ru', code: 'RU', name: 'Rusia' },
  { id: 'cn', code: 'CN', name: 'China' },
];

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'MLC', name: 'MLC', symbol: 'MLC' },
  { code: 'CUP', name: 'Peso cubano', symbol: 'CUP' },
];
