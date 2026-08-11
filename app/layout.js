import './globals.css';

export const metadata = {
  title: 'Ajaia Docs',
  description: 'A lightweight collaborative document editor',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
