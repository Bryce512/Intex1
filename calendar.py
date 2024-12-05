import requests

# Replace with your API Key
api_key = 'AIzaSyBWuZSpV2VtERnoYp9_UY29cbUwbi3dFz0'

calendar_id = 'loganspencer203@gmail.com'  # Replace with your calendar ID
url = f'https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events?key={api_key}'

# Make the request
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Print the events
    print(response.json())
else:
    print(f"Failed to fetch events. Status code: {response.status_code}")
    print(response.text)

