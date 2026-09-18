import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ResetIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}><path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round"/><path d="M3 4.5v5h5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function TrashIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}><path d="M4 7h16M10 11v6m4-6v6M9 7l.7-3h4.6l.7 3M6 7l.7 13h10.6L18 7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function CheckIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}><path d="m5 12 4.2 4.2L19 6.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
