import type { Metadata } from "next";
import { Noto_Sans_KR, Nanum_Myeongjo } from "next/font/google";
import Nav from "@/components/shared/Nav";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "HANNAsNote",
  description: "생각, 문장, 단어를 놓치지 않고 캡쳐하는 나만의 ID 노트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${nanumMyeongjo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FFF3B0] font-[family-name:var(--font-body)] text-[#3A3226]">
        <Nav />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
