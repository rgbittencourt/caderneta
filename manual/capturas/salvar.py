"""Servidor mínimo para as capturas de tela do manual: recebe POST /save/<arquivo> (porta 8767) e grava em manual/.
Uso: python3 manual/capturas/salvar.py  — e, noutro terminal, sirva uma pasta com app/ (link para o repositório)
e os arquivos desta pasta na raiz, em http://localhost:8766. Veja o passo a passo no CLAUDE.md."""
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

DESTINO = os.environ.get("DESTINO") or os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        nome = os.path.basename(self.path.split("/")[-1]) or "sem-nome.png"
        dados = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        os.makedirs(DESTINO, exist_ok=True)
        with open(os.path.join(DESTINO, nome), "wb") as f: f.write(dados)
        print("salvo:", nome, len(dados), "bytes", flush=True)
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b"ok")
    def log_message(self, *a): pass

HTTPServer(("127.0.0.1", 8767), H).serve_forever()
