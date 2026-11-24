export interface UnitOfMeasure {
  id: number;
  code: string;
  name: string;
  symbol: string;
  active: boolean;
}

export interface UnitOfMeasureRequest {
  code: string;
  name: string;
  symbol: string;
}