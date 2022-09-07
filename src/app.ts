import { App } from '@slack/bolt';
import ndarray from 'ndarray';

const app = new App ({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
});

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
`.trim().split('\n').map(r => r.split(' ').map(Number));

function genBackground(raw: number[][] = background) {
  const map = raw.map(r => r.map(o => {
    if (o === 256) return ':smile_cat:';
    return `:bg-${o}:`;
  }));
  return map;
}

function renderMap(x: number = 2, y: number = 2) {
  const nd = ndarray(([] as number[]).concat(...background), [10, 10]);
  nd.set(x, y, 256);
  const viewX = Math.min(x-2, 5);
  const viewY = Math.min(y-2, 5);
  const view = nd.lo(viewX, viewY).hi(5, 5);
  const viewArray: number[][] = [];
  for (let row = 0; row < view.shape[1]; ++row) {
    viewArray.push([]);
    for (let col = 0; col < view.shape[1]; ++col) {
      viewArray[row].push(view.get(col, row));
    }
  }
  console.log(viewArray);
  const bg = genBackground(viewArray);
  console.log(bg);
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
  if (body.container?.type !== 'message') return;
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
