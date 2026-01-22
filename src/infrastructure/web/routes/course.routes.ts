// backend/src/infrastructure/web/routes/course.routes.ts
import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';

const courseRouter = (courseController: CourseController): Router => {
    const router = Router();

    router.use(authenticate);

    router.get('/', courseController.getAllCourses.bind(courseController));
    router.get('/my-enrollments', courseController.getMyEnrollments.bind(courseController));
    router.get('/:courseId', courseController.getCourseById.bind(courseController));
    router.get('/:courseId/enrollment-status', courseController.checkEnrollment.bind(courseController));
    router.post('/:courseId/enroll', courseController.enrollInCourse.bind(courseController));
    router.get('/:courseId/lessons', courseController.getCourseLessons.bind(courseController));
    router.post('/lessons/:lessonId/complete', courseController.completeLesson.bind(courseController));
    router.get('/lessons/:lessonId', courseController.getLessonById.bind(courseController));
    return router;
};

export default courseRouter;



