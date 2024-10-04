export interface Response<T> {
  success: boolean;
  err?: string;
  data: T;
}
