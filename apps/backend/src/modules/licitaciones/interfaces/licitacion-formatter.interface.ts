import { Licitacion } from '../../scraping/shared/entities/licitacion.entity';

export interface ILicitacionFormatter {
  /**
   * Formatea licitación para listado (campos limitados)
   * @param lic Licitación a formatear
   */
  formatList(lic: Licitacion): any;

  /**
   * Formatea licitación para detalle (todos los campos)
   * @param lic Licitación a formatear
   */
  formatDetail(lic: Licitacion): any;

  /**
   * Enmascara datos sensibles (PII)
   * @param data Objeto con datos a enmascarar
   */
  maskSensitiveData(data: any): any;

  /**
   * Enmascarar NIF
   * @param nif NIF a enmascarar
   */
  maskNif(nif?: string): string | undefined;

  /**
   * Convierte Decimal a Number de forma segura
   * @param value Valor a convertir
   */
  safeDecimalToNumber(value: any): number | null;
}
