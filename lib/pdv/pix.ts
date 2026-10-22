// "PIX copia e cola" (BR Code estático) com valor, conforme o manual do Banco Central

function semAcento(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 .\-@_+]/g, "").trim();
}

function campo(id: string, valor: string) {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function pixCopiaECola(chave: string, nome: string, cidade: string, valor: number, identificador = "***") {
  const corpo = [
    campo("00", "01"),
    campo("26", campo("00", "br.gov.bcb.pix") + campo("01", chave.trim())),
    campo("52", "0000"),
    campo("53", "986"),
    campo("54", valor.toFixed(2)),
    campo("58", "BR"),
    campo("59", semAcento(nome).toUpperCase().slice(0, 25) || "RECEBEDOR"),
    campo("60", semAcento(cidade).toUpperCase().slice(0, 15) || "BRASIL"),
    campo("62", campo("05", semAcento(identificador).replace(/\s/g, "").slice(0, 25) || "***")),
    "6304",
  ].join("");
  return corpo + crc16(corpo);
}
