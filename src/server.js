const app = require('./app');
const tenantRoutes = require('./routes/tenant.routes');

const userRoutes = require('./routes/user.routes');

const projectRoutes = require('./routes/project.routes');

const taskRoutes = require('./routes/task.routes');
const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);

app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);