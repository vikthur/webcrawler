async function pushToChannel(array, channel, queue) {
  const message = JSON.stringify(array);
  await channel.assertQueue(queue, { durable: false });
  await channel.sendToQueue(queue, Buffer.from(message));
}

module.exports = { pushToChannel };
