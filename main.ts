import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import logger from "https://deno.land/x/oak_logger/mod.ts";

let messages: Array<
  { text: string; username: string; roomId: string; timestamp: string }
> = [];

let activeUsers: Array<{ username: string; timeoutId: number }> = [];

const router = new Router();

router
  .get("/active-users", (context) => {
    context.response.body = Array.from(
      activeUsers.map((user) => user.username),
    );
  })
  .get("/messages", (context) => {
    context.response.body = Array.from(messages);
  }).post("/messages", async (context) => {
    const body = await context.request.body().value;
    const params = new URLSearchParams(Object.entries(body.message ?? {}));

    const message = getMessageFromParams(params);

    if (message) {
      messages.push(message);
    }

    context.response.body = Array.from(messages);
  }).post("/messages/delete", (context) => {
    messages = [];
    context.response.redirect("/");
  })
  .get("/", (context) => {
    const params = context.request.url.searchParams;
    const message = getMessageFromParams(params);

    if (message) {
      messages.push(message);
    }

    context.response.body = new TextEncoder().encode(`
    <html>
        
        <form style="display:flex; flex-direction:column; gap:1rem; width:20ch;">
            <label>
            username
            <input name="username" required  />
            </label>
            <label>
            message
             <textarea name="text" required></textarea>
            </label>
            <label>
            room id
            <input name="room-id" type="number"/>
            </label>

            <button>Post</button>
            
        </form>
        <form method="post" action="messages/delete"><button>Delete messages</button></form>

        <h2>messages</h2>
        <ul>
            ${
      messages.map((message) => `<li>${JSON.stringify(message)}</li>`).join(
        "\n",
      )
    }
        </ul>
    
        <h2>active users</h2>
        <ul>
            ${activeUsers.map((user) => `<li>${user.username}</li>`).join("\n")}

        </ul>
    

    </html>    
    `);
  });

const app = new Application();
app.use(logger.logger);
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());

console.info("CORS-enabled web server listening on port 8000");
await app.listen({ port: 8000 });

function getMessageFromParams(params: URLSearchParams) {
  const text = params.get("text");
  const username = params.get("username");
  const roomId = params.get("room-id") || null;
  if (!text || !username) {
    return null;
  }

  addActiveUser(username);

  return {
    text: String(text),
    username: String(username),
    roomId: String(roomId ?? ""),
    timestamp: new Date().getTime().toString(),
  };
}

function addActiveUser(username: string) {
  const currentUser = activeUsers.find((user) => user.username === username);
  if (currentUser) {
    clearTimeout(currentUser.timeoutId);
  }
  activeUsers.push({
    username: username,
    timeoutId: setTimeout(() => {
      activeUsers = activeUsers.filter((user) => user.username !== username);
    }, 10000),
  });
}
