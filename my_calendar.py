import requests

# Replace with your API key and public calendar ID
api_key = "AIzaSyBWuZSpV2VtERnoYp9_UY29cbUwbi3dFz0"
calendar_id = "loganspencer203@gmail.com"

# API endpoint for public calendar events
url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events?key={api_key}"

# Make the request
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Print the events
    events = response.json().get('items', [])
    if not events:
        print("No events found.")
    else:
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            print(f"{start}: {event.get('summary', 'No Title')}")
else:
    print(f"Failed to fetch events. Status code: {response.status_code}")
    print(response.text)



