## How to run reminder

1. Copy configuration into user systemd directory

```
cp check-in-bot-reminder.service check-in-bot-reminder.timer ~/.config/systemd/user
```

2. Reload your systemd

```
systemctl --user daemon-reload
```

3. One-time execution

```
systemctl start --user check-in-bot-reminder.service
systemctl status --user check-in-bot-reminder.service
```

Your should see
```
● check-in-bot-reminder.service - Remind check-in-bot user
   Loaded: loaded (/home/ubuntu/.config/systemd/user/check-in-bot-reminder.service; static; vendor preset: enabled)
   Active: inactive (dead) since Mon 2018-01-29 02:49:18 UTC; 30s ago
  Process: 17870 ExecStart=/usr/local/bin/docker-compose exec -T node npm run reminder (code=exited, status=0/SUCCESS)
 Main PID: 17870 (code=exited, status=0/SUCCESS)
```

4. Set timer execution

```
systemctl enable --user check-in-bot-reminder.timer
```

5. Remember to ask your system admin to enable you the systemd timer
