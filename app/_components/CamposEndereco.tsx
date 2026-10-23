"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { UFS, buscarCep, cidadesDoEstado, type Endereco } from "@/lib/endereco";
import { mascaraCep } from "@/lib/mascaras";

// CEP → preenche rua, bairro, cidade e estado. A cidade é uma lista do estado
// escolhido (IBGE); sem internet para o serviço, vira campo de texto.
export function CamposEndereco({ valor, onChange, disabled, classeCampo, classeRotulo = "text-xs text-gray-400", completo = true, obrigatorio = false }: {
  valor: Endereco;
  onChange: (v: Endereco) => void;
  disabled?: boolean;
  classeCampo: string;
  classeRotulo?: string;
  completo?: boolean; // false = só CEP, cidade e estado
  obrigatorio?: boolean;
}) {
  const [buscando, setBuscando] = useState(false);
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const [cidades, setCidades] = useState<{ uf: string; lista: string[] | null } | null>(null);
  const numero = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!valor.estado) return;
    let vivo = true;
    cidadesDoEstado(valor.estado).then((lista) => { if (vivo) setCidades({ uf: valor.estado, lista }); });
    return () => { vivo = false; };
  }, [valor.estado]);

  const mudarCep = async (texto: string) => {
    const cep = mascaraCep(texto);
    onChange({ ...valor, cep });
    setAvisoCep(null);
    if (cep.replace(/\D/g, "").length !== 8) return;
    setBuscando(true);
    const achado = await buscarCep(cep);
    setBuscando(false);
    if (!achado) return setAvisoCep("CEP não encontrado. Preencha o endereço abaixo.");
    onChange({
      ...valor, cep,
      logradouro: achado.logradouro || valor.logradouro,
      bairro: achado.bairro || valor.bairro,
      cidade: achado.cidade || valor.cidade,
      estado: achado.estado || valor.estado,
    });
    if (completo) numero.current?.focus();
  };

  const set = (k: keyof Endereco) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...valor, [k]: e.target.value });
  const listaCidades = cidades?.uf === valor.estado ? cidades.lista : null;
  const cidadeForaDaLista = !!listaCidades && !!valor.cidade && !listaCidades.includes(valor.cidade);

  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <label className="block sm:col-span-2">
        <span className={classeRotulo}>CEP</span>
        <div className="relative mt-1.5">
          <input inputMode="numeric" autoComplete="postal-code" value={valor.cep} onChange={(e) => mudarCep(e.target.value)} disabled={disabled}
            placeholder="00000-000" required={obrigatorio} className={classeCampo} />
          {buscando && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
        </div>
        {avisoCep && <span className="mt-1 block text-xs text-amber-300">{avisoCep}</span>}
      </label>
      {completo && (
        <>
          <label className="block sm:col-span-4">
            <span className={classeRotulo}>Rua / avenida</span>
            <input autoComplete="address-line1" value={valor.logradouro} onChange={set("logradouro")} disabled={disabled} maxLength={160} required={obrigatorio} className={`${classeCampo} mt-1.5`} />
          </label>
          <label className="block sm:col-span-2">
            <span className={classeRotulo}>Número</span>
            <input ref={numero} value={valor.numero} onChange={set("numero")} disabled={disabled} maxLength={20} className={`${classeCampo} mt-1.5`} />
          </label>
          <label className="block sm:col-span-2">
            <span className={classeRotulo}>Complemento</span>
            <input autoComplete="address-line2" value={valor.complemento} onChange={set("complemento")} disabled={disabled} maxLength={80} className={`${classeCampo} mt-1.5`} />
          </label>
          <label className="block sm:col-span-2">
            <span className={classeRotulo}>Bairro</span>
            <input value={valor.bairro} onChange={set("bairro")} disabled={disabled} maxLength={80} className={`${classeCampo} mt-1.5`} />
          </label>
        </>
      )}
      <label className="block sm:col-span-2">
        <span className={classeRotulo}>Estado</span>
        <select value={valor.estado} onChange={(e) => onChange({ ...valor, estado: e.target.value, cidade: "" })} disabled={disabled} required={obrigatorio} className={`${classeCampo} mt-1.5`}>
          <option value="">UF</option>
          {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-4">
        <span className={classeRotulo}>Cidade</span>
        {listaCidades ? (
          <select value={valor.cidade} onChange={set("cidade")} disabled={disabled} required={obrigatorio} className={`${classeCampo} mt-1.5`}>
            <option value="">Escolha a cidade</option>
            {cidadeForaDaLista && <option value={valor.cidade}>{valor.cidade}</option>}
            {listaCidades.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : (
          <input autoComplete="address-level2" value={valor.cidade} onChange={set("cidade")} disabled={disabled} maxLength={80} required={obrigatorio}
            placeholder={valor.estado ? "Carregando cidades…" : "Escolha o estado primeiro"} className={`${classeCampo} mt-1.5`} />
        )}
      </label>
    </div>
  );
}
