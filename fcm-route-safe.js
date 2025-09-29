// Replace line 615 in src/app.ts with this:
app.get("/admin/fcm-management", async (request, reply) => {
    try {
        const path = "/var/www/goatgoat-staging/server/src/public/fcm-dashboard/index.html";
        return reply.sendFile(path);
    } catch (error) {
        reply.status(500).send(`<h1>FCM Dashboard Error</h1><p>${error.message}</p>`);
    }
});