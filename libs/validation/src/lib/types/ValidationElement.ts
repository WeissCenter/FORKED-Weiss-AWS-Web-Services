export interface ValidationElement{
    tag: keyof HTMLElementTagNameMap,
    class?: string,
    id?: string,
    index?: number,
}