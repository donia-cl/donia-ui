
export const cleanRut = (rut: string): string => {
  return typeof rut === 'string' ? rut.replace(/[^0-9kK]/g, '') : '';
};

export const formatRut = (rut: string): string => {
  const clean = cleanRut(rut);
  if (clean.length <= 1) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
};

export const validateRut = (rut: string): boolean => {
  if (!rut || rut.trim().length < 3) return false;
  const clean = cleanRut(rut);
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  if (body.length < 7) return false; // RUT muy corto

  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= body.length; i++) {
    const index = multiplo * parseInt(clean.charAt(body.length - i));
    suma = suma + index;
    if (multiplo < 7) {
      multiplo = multiplo + 1;
    } else {
      multiplo = 2;
    }
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalculado = '';
  
  if (dvEsperado === 11) dvCalculado = '0';
  else if (dvEsperado === 10) dvCalculado = 'K';
  else dvCalculado = dvEsperado.toString();

  return dvCalculado === dv;
};

export const formatPhone = (phone: string): string => {
  // Limpiar todo lo que no sea número
  let clean = phone.replace(/\D/g, '');
  
  // Si empieza con 569, lo dejamos tal cual, si empieza con 9, agregamos 56
  if (clean.startsWith('9') && clean.length === 9) {
    clean = '56' + clean;
  }
  
  // Formato visual: +56 9 XXXX XXXX
  if (clean.length > 0) {
     if (clean.startsWith('56')) {
        const part1 = clean.substring(2, 3); // 9
        const part2 = clean.substring(3, 7);
        const part3 = clean.substring(7, 11);
        return `+56 ${part1} ${part2} ${part3}`.trim();
     }
  }
  return phone;
};

export const validateChileanPhone = (phone: string): boolean => {
  const clean = phone.replace(/\D/g, '');
  // Debe ser 56 + 9 + 8 dígitos = 11 dígitos en total
  return clean.length === 11 && clean.startsWith('569');
};
