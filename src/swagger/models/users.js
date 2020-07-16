/**
 * @swagger
 * components:
 *    schemas:
 *      User:
 *        type: object
 *        required:
 *          - firstname
 *          - lastname
 *          - phoneNumber
 *          - email
 *        items:
 *         properties:
 *          firstname:
 *            type: string
 *          lastname:
 *            type: string
 *          address:
 *            type: string
 *          phoneNumber:
 *            type: string
 *          imageUrl:
 *            type: string
 *          password:
 *            type: string
 *          confirmPassword:
 *            type: string
 *          email:
 *            type: string
 *            format: email
 */