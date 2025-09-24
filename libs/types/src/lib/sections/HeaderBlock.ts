import { StringTemplate } from "../ITemplate";

export interface HeaderBlock {
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  text: StringTemplate | string;
  body: StringTemplate | string;
}
