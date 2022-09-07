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

const defaultMap = ndarray(([] as number[]).concat(...background), [getWidth(), getHeight()]);

const VIEW_WIDTH = 8;
const VIEW_HEIGHT = 6;
const VIEW_WIDTH_HALF = Math.floor(VIEW_WIDTH / 2);
const VIEW_HEIGHT_HALF = Math.floor(VIEW_HEIGHT / 2);

function getWidth() {
  return background[0].length;
}

function getHeight() {
  return background.length;
}

function getMap() {
  return ndarray(([] as number[]).concat(...background), [getWidth(), getHeight()]);
}

function renderTile(tile: number) {
  if (tile === 256) return ':smile_cat:';
  return `:bg-${tile}:`;
}

function renderTiles(view: ndarray.NdArray<number[]> = defaultMap) {
  const viewArray: string[][] = [];

  for (let row = 0; row < view.shape[1]; ++row) {
    viewArray.push([]);
    for (let col = 0; col < view.shape[0]; ++col) {
      const tile = view.get(col, row);
      viewArray[row].push(renderTile(tile));
    }
  }
  return viewArray;
}

function sliceView(nd: ndarray.NdArray<number[]>, x: number, y: number)  {
  const left = Math.min(x - VIEW_WIDTH_HALF, getWidth() - VIEW_WIDTH);
  const top = Math.min(y - VIEW_HEIGHT_HALF, getHeight() - VIEW_HEIGHT);
  return nd.lo(left, top).hi(VIEW_WIDTH, VIEW_HEIGHT);
}

function renderView(x: number = 2, y: number = 2) {
  const map = getMap();
  map.set(x, y, 256);
  const view = sliceView(map, x, y);
  const renderedArray = renderTiles(view);
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": renderedArray.map(r => r.join('')).join('\n'),
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
      renderView(),
      renderButtons(),
    ]
  })
  console.log(res)
});

app.action(/button-(left|right|up|down)/, async ({ body, action, ack, client, respond }) => {
  await ack();
  if (action.type !== 'button') return;
  if (body.type !== 'block_actions') return;
  if (body.container?.type !== 'message') return;

  const [x, y] = action.value.split('-').map(Number);
  if (defaultMap.get(x, y) === 0) return;
  await respond({
    blocks: [
      renderView(x, y),
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
