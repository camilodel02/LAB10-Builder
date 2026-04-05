from lab10_api.app.example import ping_message


def test_ping_message():
    assert ping_message() == "pong"
