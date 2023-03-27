import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import logger from "https://deno.land/x/oak_logger/mod.ts";

let messages: Array<
  { text: string; username: string; roomId: string; timestamp: string }
> = [];
let activeUsers: string[] = [];

function getMessageFromParams(params: URLSearchParams) {
  const text = params.get("text");
  const username = params.get("username");
  const roomId = params.get("room-id") || null;
  if (!text || !username) {
    return null;
  }

  return {
    text: String(text),
    username: String(text),
    roomId: String(roomId ?? ""),
    timestamp: new Date().getTime().toString(),
  };
}

const router = new Router();

router
  .post("/active-users/:username", (context) => {
    activeUsers = activeUsers.filter((username) =>
      username !== context.params.username
    ).concat(context.params.username);
    context.response.body = Array.from(activeUsers);
  })
  .delete("/active-users/:username", (context) => {
    activeUsers = activeUsers.filter((username) =>
      username !== context.params.username
    );
    context.response.body = Array.from(activeUsers);
  })
  .get("/active-users", (context) => {
    context.response.body = Array.from(activeUsers);
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

        <ul>
            ${
      messages.map((message) => `<li>${JSON.stringify(message)}</li>`).join("")
    }
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
