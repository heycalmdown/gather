import { App } from '@slack/bolt';

const app = new App ({
  appToken: 'xapp-1-A041ARPT95H-4042012538741-cc1871f14a12e94c8334f88661f50aa7b2c990b7cb334a0d3d0602a1027bf9fb',
  token: 'xoxb-31642232595-4068682162160-X2pkBpZjgbaZuQqMBYT8dpaO',
  socketMode: true,
});

function tileBg() {
  return ':green-bg:'
}

function deepcopy(val: any) {
  return JSON.parse(JSON.stringify(val))
}

const background = `
0 0 0 0 0 0 0 0 0 0
0 1 1 1 1 1 1 1 1 0
0 1 1 1 1 1 1 1 1 0
0 1 1 2 2 2 2 1 1 0
0 1 1 2 2 2 2 1 1 0
0 1 1 2 2 2 2 1 1 0
0 1 1 2 2 2 2 1 1 0
0 1 1 1 1 1 1 1 1 0
0 1 1 1 1 1 1 1 1 0
0 0 0 0 0 0 0 0 0 0
`

function genBackground() {
  const raw = background.trim().split('\n').map(r => r.split(' '));
  const map = raw.map(r => r.map(o => `:bg-${o}:`));
  return map;
}

function renderMap(x: number = 2, y: number = 2) {
  const bg = genBackground();
  bg[y][x] = ':smile_cat:';
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": bg.map(r => r.join('')).join('\n'),
    }
  }
}

function renderButtons(x: number = 2, y: number = 2) {
  return {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": ":arrow_left:",
          "emoji": true
        },
        "value": [x-1, y].join('-'),
        action_id: 'button-left'
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": ":arrow_up:",
          "emoji": true
        },
        "value": [x, y-1].join('-'),
        action_id: 'button-up'
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": ":arrow_down:",
          "emoji": true
        },
        "value": [x, y+1].join('-'),
        action_id: 'button-down'
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": ":arrow_right:",
          "emoji": true
        },
        "value": [x+1, y].join('-'),
        action_id: 'button-right'
      }
    ]
  }
}

app.command('/gather', async ({ command, ack, client }) => {
  await ack();
  console.log(command);
  const res = await client.chat.postEphemeral({
    channel: command.channel_id,
    text: 'gather',
    user: command.user_id,
    blocks: [
      renderMap(),
      renderButtons(),
    ]
  })
  console.log(res)
});

app.action(/button-(left|right|up|down)/, async ({ body, action, ack, client, respond }) => {
  await ack();
  console.log(action, body);
  if (action.type !== 'button') return;
  if (body.type !== 'block_actions') return;
  if (body.container.type !== 'message') return;
  const [x, y] = action.value.split('-').map(Number);
  const map = genBackground();
  if (map[y][x] === ':bg-0:') return;
  await respond({
    blocks: [
      renderMap(x, y),
      renderButtons(x, y),
    ]
  });
  // await client.chat.update({
  //   channel: body.channel?.id!,
  //   ts: body.container.message_ts,
  //   text: 'gather',
  //   blocks: [
  //     renderMap(2, 1),
  //     renderButtons(),
  //   ]
  // })
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 4000);

  console.log('⚡️ Bolt app is running!');
})();
