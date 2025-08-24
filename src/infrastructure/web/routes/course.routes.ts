// backend/src/infrastructure/web/routes/course.routes.ts
import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const courseController = new CourseController();

router.use(authenticate);

router.get('/', courseController.getAllCourses);
router.get('/my-enrollments', courseController.getMyEnrollments);
router.get('/:courseId', courseController.getCourseById);
router.get('/:courseId/enrollment-status', courseController.checkEnrollment);
router.post('/:courseId/enroll', courseController.enrollInCourse);
router.get('/:courseId/lessons', courseController.getCourseLessons);
router.post('/lessons/:lessonId/complete', courseController.completeLesson);
router.get('/lessons/:lessonId', courseController.getLessonById);

export { router as courseRouter };