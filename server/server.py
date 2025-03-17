from aiohttp import web, WSMsgType
import uuid
import json
import os

class WebRTCRoom:
    def __init__(self):
        self.clients = set()

rooms = {}
app = web.Application()

async def index(request):
    return web.FileResponse(os.path.join('public', 'index.html'))

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    client_id = str(uuid.uuid4())
    current_room = None

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                data = json.loads(msg.data)
                
                if data['type'] == 'join':
                    room_id = data.get('roomId', str(uuid.uuid4()))
                    if room_id not in rooms:
                        rooms[room_id] = WebRTCRoom()
                    current_room = rooms[room_id]
                    current_room.clients.add(ws)
                    await ws.send_str(json.dumps({
                        'type': 'room',
                        'roomId': room_id
                    }))
                
                elif current_room:
                    for client in current_room.clients:
                        if client != ws and not client.closed:
                            await client.send_str(msg.data)
    
    finally:
        if current_room:
            current_room.clients.remove(ws)
            if not current_room.clients:
                del rooms[room_id]

    return ws

app.router.add_get('/', index)
app.router.add_static('/static', 'public')
app.router.add_route('GET', '/ws', websocket_handler)

if __name__ == '__main__':
    web.run_app(app, port=8080)