import { ValidationElement } from "../ValidationElement";

export interface Schema{
    name: string;
    errorText?: string,
    element?: ValidationElement,
    type: "string" | "number" | "select"
}