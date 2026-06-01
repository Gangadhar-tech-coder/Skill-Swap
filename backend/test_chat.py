import asyncio
import json
import requests
import websockets

API_URL = "http://localhost:8000/api"
WS_URL = "ws://localhost:8000/api/chat/ws"

def login(email, password):
    r = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    data = r.json()
    token = data["access_token"]
    
    r2 = requests.get(f"{API_URL}/user/profile", headers={"Authorization": f"Bearer {token}"})
    r2.raise_for_status()
    user = r2.json()
    return token, user

def create_session(token, teacher_id):
    r = requests.post(
        f"{API_URL}/sessions/request", 
        headers={"Authorization": f"Bearer {token}"},
        json={
            "teacher_id": teacher_id,
            "skill_offered": "Python Programming",
            "skill_requested": "UI Design",
            "duration": 1.0,
            "preferred_time": "Tomorrow at 10 AM"
        }
    )
    if r.status_code == 400 and "active or pending skill swap session" in r.text:
        r2 = requests.get(f"{API_URL}/sessions/", headers={"Authorization": f"Bearer {token}"})
        sessions = r2.json()
        for s in sessions:
            if s["status"] in ["pending", "accepted", "in_progress"]:
                return s
    r.raise_for_status()
    return r.json()

def accept_session(token, session_id):
    r = requests.post(f"{API_URL}/sessions/accept/{session_id}", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 400:
        pass
    else:
        r.raise_for_status()

def start_session(token, session_id):
    r = requests.post(f"{API_URL}/sessions/start/{session_id}", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 400:
        pass
    else:
        r.raise_for_status()

async def ws_client(name, ws_url, session_id, user_id, message_to_send, wait_seconds_before_send=0):
    url = f"{ws_url}/{session_id}"
    print(f"[{name}] Connecting to {url}...")
    async with websockets.connect(url) as websocket:
        print(f"[{name}] Connected.")
        
        if wait_seconds_before_send > 0:
            await asyncio.sleep(wait_seconds_before_send)
            
        msg = {
            "type": "message",
            "message": message_to_send,
            "sender_id": user_id
        }
        await websocket.send(json.dumps(msg))
        print(f"[{name}] Sent: '{message_to_send}'")
        
        # We expect to receive messages (including our own reflection)
        for _ in range(2):
            try:
                resp = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(resp)
                sender = "System" if "sender_id" not in data else data["sender_id"]
                print(f"[{name}] Received from {sender}: '{data.get('message')}'")
            except asyncio.TimeoutError:
                break

async def main():
    print("Logging in Alice...")
    alice_token, alice_user = login("alice@example.com", "password123")
    print(f"Alice ID: {alice_user['id']}")

    print("Logging in Bob...")
    bob_token, bob_user = login("bob@example.com", "password123")
    print(f"Bob ID: {bob_user['id']}")

    print("Alice requests session with Bob...")
    session = create_session(alice_token, bob_user['id'])
    session_id = session['id']
    print(f"Session ID: {session_id}, Status: {session['status']}")

    if session['status'] == 'pending':
        print("Bob accepts session...")
        accept_session(bob_token, session_id)
        
    print("Bob starts session...")
    start_session(bob_token, session_id)

    print("Starting WebSocket chat simulation...")
    # Alice sends immediately, Bob sends after 1 second
    await asyncio.gather(
        ws_client("Alice", WS_URL, session_id, alice_user['id'], "Hi Bob, thanks for accepting!"),
        ws_client("Bob", WS_URL, session_id, bob_user['id'], "Hello Alice, ready to learn UI Design?", wait_seconds_before_send=1)
    )
    
    print("\nVerifying chat history via HTTP API...")
    r = requests.get(f"{API_URL}/chat/history/{session_id}", headers={"Authorization": f"Bearer {alice_token}"})
    r.raise_for_status()
    history = r.json()
    print(f"Found {len(history)} messages in DB:")
    for msg in history[-2:]:
        sender = "Alice" if msg["sender_id"] == alice_user["id"] else "Bob"
        print(f"[{msg['timestamp']}] {sender}: {msg['message']}")
    print("\nSUCCESS: Chat flow verified!")

if __name__ == "__main__":
    asyncio.run(main())
