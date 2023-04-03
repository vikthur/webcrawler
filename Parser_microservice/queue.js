async function pushToChannel(array, channel, queue) {
  console.log(array, "array", "queue", queue);
  const message = JSON.stringify(array);
  await channel.assertQueue(queue, { durable: true });
  await channel.sendToQueue(queue, Buffer.from(message));
}

module.exports = { pushToChannel };
