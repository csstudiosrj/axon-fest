// Rodapé padrão de todas as áreas
export function Direitos({ className = "" }: { className?: string }) {
  return (
    <p className={className}>
      © {new Date().getFullYear()} ARXUM Fest, todos os direitos reservados ao{" "}
      <a href="https://arxum.com.br" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">ARXUM group</a>
    </p>
  );
}
