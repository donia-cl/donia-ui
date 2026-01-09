
// api/_utils.ts

// 1. LOGGER ESTRUCTURADO PARA AUDITORÍA
export const logger = {
  info: (action: string, meta: any = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      action,
      ...meta
    }));
  },
  error: (action: string, error: any, meta: any = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      action,
      error: error.message || error,
      stack: error.stack,
      ...meta
    }));
  },
  audit: (userId: string, action: string, resourceId: string, details: any = {}) => {
    console.log(JSON.stringify({
      level: 'AUDIT',
      timestamp: new Date().toISOString(),
      userId,
      action,
      resourceId,
      ...details
    }));
  }
};

// 2. VALIDADOR DE INPUTS (ZERO-DEPENDENCY)
export class Validator {
  static required(value: any, fieldName: string) {
    if (value === undefined || value === null || value === '') {
      throw new Error(`Campo requerido faltante: ${fieldName}`);
    }
  }

  static string(value: any, minLength: number, fieldName: string) {
    if (typeof value !== 'string') throw new Error(`${fieldName} debe ser texto.`);
    if (value.length < minLength) throw new Error(`${fieldName} es muy corto (mínimo ${minLength} caracteres).`);
    // Basic sanitization check
    if (value.includes('<script>')) throw new Error(`${fieldName} contiene caracteres no permitidos.`);
  }

  static number(value: any, min: number, fieldName: string) {
    const num = Number(value);
    if (isNaN(num)) throw new Error(`${fieldName} debe ser un número.`);
    if (num < min) throw new Error(`${fieldName} debe ser mayor o igual a ${min}.`);
  }

  static email(value: any) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) throw new Error(`Email inválido: ${value}`);
  }

  static uuid(value: any, fieldName: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!value || !uuidRegex.test(value)) throw new Error(`${fieldName} ID inválido.`);
  }
}

// 3. RATE LIMITER (IN-MEMORY FOR WARM LAMBDAS)
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

export const checkRateLimit = (ip: string, limit: number = 10, windowMs: number = 60000) => {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  if (record.count > limit) {
    logger.error('RATE_LIMIT_EXCEEDED', { ip, count: record.count });
    throw new Error('Demasiadas solicitudes. Intente nuevamente en unos minutos.');
  }
};
