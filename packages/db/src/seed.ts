import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { questions } from "./schema/questions";

// Load environment variables FIRST
dotenv.config({
	path: join(process.cwd(), "../../apps/web/.env"),
});

// Create db connection AFTER environment is loaded
const db = drizzle(process.env.DATABASE_URL!);

interface QuestionData {
	id: string;
	category: string;
	question: string;
	options: string[];
	correctAnswer: number;
	explanation: string;
	code?: string;
	difficulty: string;
}

async function seed() {
	console.log("🌱 Starting seed...");

	try {
		// Read questions from JSON file
		// Try multiple possible paths
		const possiblePaths = [
			join(process.cwd(), "../../all-questions.json"), // from packages/db
			join(process.cwd(), "../../../all-questions.json"), // alternative
			join(__dirname, "../../../all-questions.json"), // from src directory
		];

		let questionsPath = "";
		for (const path of possiblePaths) {
			try {
				if (readFileSync(path, "utf-8")) {
					questionsPath = path;
					break;
				}
			} catch (e) {
				continue;
			}
		}

		if (!questionsPath) {
			throw new Error(
				`Could not find all-questions.json in any of these paths:\n${possiblePaths.join("\n")}`
			);
		}

		console.log(`📁 Reading from: ${questionsPath}`);
		const questionsData: QuestionData[] = JSON.parse(
			readFileSync(questionsPath, "utf-8")
		);

		console.log(`📚 Found ${questionsData.length} questions to seed`);

		// Clear existing questions (optional - comment out if you want to keep existing data)
		console.log("🗑️  Clearing existing questions...");
		await db.delete(questions);

		// Insert questions
		console.log("📝 Inserting questions...");
		const result = await db.insert(questions).values(
			questionsData.map((q) => ({
				id: q.id,
				category: q.category,
				question: q.question,
				options: q.options,
				correctAnswer: q.correctAnswer,
				explanation: q.explanation,
				code: q.code || null,
				difficulty: q.difficulty,
				createdAt: new Date(),
			}))
		);

		console.log("✅ Seed completed successfully!");
		console.log(`   Inserted ${questionsData.length} questions`);

		// Show some stats
		const categories = [...new Set(questionsData.map((q) => q.category))];
		console.log(`\n📊 Statistics:`);
		console.log(`   Categories: ${categories.length}`);
		categories.forEach((cat) => {
			const count = questionsData.filter((q) => q.category === cat).length;
			console.log(`   - ${cat}: ${count}`);
		});

		const difficulties = {
			easy: questionsData.filter((q) => q.difficulty === "easy").length,
			medium: questionsData.filter((q) => q.difficulty === "medium").length,
			hard: questionsData.filter((q) => q.difficulty === "hard").length,
		};
		console.log(`\n   Difficulties:`);
		console.log(`   - Easy: ${difficulties.easy}`);
		console.log(`   - Medium: ${difficulties.medium}`);
		console.log(`   - Hard: ${difficulties.hard}`);
	} catch (error) {
		console.error("❌ Seed failed:", error);
		process.exit(1);
	}

	process.exit(0);
}

seed();

