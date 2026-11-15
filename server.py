#!/usr/bin/env python3
"""Servidor estático do jogo, sem montagem ou busca de pastas de mods externas."""
import argparse
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.split('?')[0].endswith(('.js','.mjs','.json','.html','.css')):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8081)
    parser.add_argument('--host',default='127.0.0.1')
    args=parser.parse_args()
    server=ThreadingHTTPServer((args.host,args.port),partial(Handler,directory=str(Path(__file__).resolve().parent)))
    print(f'Quadrum: http://{args.host}:{args.port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
