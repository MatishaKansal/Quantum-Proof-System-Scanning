const express = require("express");
const { getPool } = require("../data/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get all migration phases with their tasks
router.get("/phases", requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    
    // Get all phases ordered by phase_order
    const phasesResult = await pool.query(
      "SELECT id, title, status, timeline, phase_order, description FROM migration_phases ORDER BY phase_order ASC"
    );
    
    // Get all tasks grouped by phase
    const tasksResult = await pool.query(
      "SELECT id, phase_id, task_text, completed FROM migration_tasks ORDER BY phase_id, id ASC"
    );
    
    // Build phases with tasks
    const phases = phasesResult.rows.map((phase) => {
      const tasks = tasksResult.rows
        .filter((task) => task.phase_id === phase.id)
        .map((task) => ({
          id: task.id,
          text: task.task_text,
          done: task.completed,
        }));
      
      return {
        id: phase.id,
        title: phase.title,
        status: phase.status.replace("-", "_"),
        timeline: phase.timeline,
        tasks,
      };
    });
    
    res.json(phases);
  } catch (error) {
    console.error("Error fetching migration phases:", error);
    res.status(500).json({ error: "Failed to fetch migration phases" });
  }
});

// Get all PQC algorithms
router.get("/pqc-algorithms", requireAuth, async (req, res) => {
  try {
    const pool = getPool();
    
    const result = await pool.query(
      "SELECT id, name, type, category, description FROM pqc_algorithms ORDER BY category, name ASC"
    );
    
    const algorithms = result.rows.map((algo) => ({
      id: algo.id,
      name: algo.name,
      type: algo.type,
      description: algo.description,
    }));
    
    res.json(algorithms);
  } catch (error) {
    console.error("Error fetching PQC algorithms:", error);
    res.status(500).json({ error: "Failed to fetch PQC algorithms" });
  }
});

// Update phase status
router.put("/phases/:phaseId/status", requireAuth, async (req, res) => {
  try {
    const { phaseId } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!["complete", "in_progress", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const pool = getPool();
    
    const result = await pool.query(
      "UPDATE migration_phases SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status.replace("_", "-"), phaseId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Phase not found" });
    }
    
    res.json({
      id: result.rows[0].id,
      title: result.rows[0].title,
      status: result.rows[0].status.replace("-", "_"),
      timeline: result.rows[0].timeline,
    });
  } catch (error) {
    console.error("Error updating phase status:", error);
    res.status(500).json({ error: "Failed to update phase status" });
  }
});

// Update task completion
router.put("/tasks/:taskId/completion", requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;
    
    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be boolean" });
    }
    
    const pool = getPool();
    
    const result = await pool.query(
      "UPDATE migration_tasks SET completed = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [completed, taskId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.json({
      id: result.rows[0].id,
      phaseId: result.rows[0].phase_id,
      text: result.rows[0].task_text,
      done: result.rows[0].completed,
    });
  } catch (error) {
    console.error("Error updating task completion:", error);
    res.status(500).json({ error: "Failed to update task completion" });
  }
});

module.exports = router;
