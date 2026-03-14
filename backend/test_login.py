import requests

def test_flow():
    # Login
    r1 = requests.post('http://localhost:8000/api/auth/login', json={'email': 'alice@example.com', 'password': 'password123'})
    print('Login Status:', r1.status_code)
    print('Login Body:', r1.text)
    
    if r1.status_code != 200:
        return
        
    token = r1.json().get('access_token')
    print('Token:', token)
    
    # Profile
    r2 = requests.get('http://localhost:8000/api/user/profile', headers={'Authorization': f'Bearer {token}'})
    print('Profile Status:', r2.status_code)
    print('Profile Body:', r2.text)

if __name__ == '__main__':
    test_flow()
