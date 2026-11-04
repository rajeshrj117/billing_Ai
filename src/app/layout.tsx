import "./globals.css";import {Provider} from "@/lib/store";import {Shell} from "@/components/Shell";
export const metadata={title:"ScanBill AI",description:"AI handwritten bill scanner and sales dashboard"};
export default function L({children}:{children:React.ReactNode}){return <html lang="en"><body><Provider><Shell>{children}</Shell></Provider></body></html>}