import { StringTemplate } from "../ITemplate";

export interface CommentBlock {
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  type: "standard" | "error";
  label: StringTemplate | string;
  body: StringTemplate | string;
}
