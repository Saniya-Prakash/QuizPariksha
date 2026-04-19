package com.app.quizparikshainstitute.data.api

import com.app.quizparikshainstitute.model.Announcement
import com.app.quizparikshainstitute.model.Assignment
import com.app.quizparikshainstitute.model.AuthResponse
import com.app.quizparikshainstitute.model.Batch
import com.app.quizparikshainstitute.model.BatchAssignment
import com.app.quizparikshainstitute.model.BatchForm
import com.app.quizparikshainstitute.model.BatchTeacher
import com.app.quizparikshainstitute.model.BatchX
import com.app.quizparikshainstitute.model.Book
import com.app.quizparikshainstitute.model.FormWithQuestion
import com.app.quizparikshainstitute.model.LiveQuiz
import com.app.quizparikshainstitute.model.Option
import com.app.quizparikshainstitute.model.OptionText
import com.app.quizparikshainstitute.model.Question
import com.app.quizparikshainstitute.model.QuestionAnswer
import com.app.quizparikshainstitute.model.QuestionText
import com.app.quizparikshainstitute.model.Quiz
import com.app.quizparikshainstitute.model.QuizFormUploadPayload
import com.app.quizparikshainstitute.model.QuizX
import com.app.quizparikshainstitute.model.ResponseWithForm
import com.app.quizparikshainstitute.model.Teacher
import com.app.quizparikshainstitute.model.TeacherProfile
import com.app.quizparikshainstitute.model.UploadResponse
import com.app.quizparikshainstitute.model.UploadResult
import com.app.quizparikshainstitute.model.User
import com.app.quizparikshainstitute.model.UserRankResult
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Query
import retrofit2.http.Url

interface SupabaseApi {

    @POST("/functions/v1/create-user")
    suspend fun signUp(
        @Body body: Map<String, String>,
    ): Response<AuthResponse>

    @POST("/rest/v1/User")
    suspend fun insertUser(
        @Body user: User,
        @Header("Prefer") preferHeader: String = "return=representation"
    ): Response<List<User>>


    @POST("/rest/v1/teacherprofile")
    suspend fun insertTeacher(
        @Body teacher: TeacherProfile,
    ): Response<Void>

    @GET("/rest/v1/User")
    suspend fun getUserBySupabaseId(
        @Query("id") id: String, // 'id' column = supabase_user_id
    ): Response<List<User>>

    @POST("/rest/v1/rpc/create_batch")
    suspend fun addBatch(
        @Body updatedFields: Map<String, @JvmSuppressWildcards Any>,
        @Header("Prefer") prefer: String = "return=representation",
    ): Response<ResponseBody>

    @GET("/rest/v1/batch")
    suspend fun getBatchesByUser(
        @Query("created_by") createdBy: String, // This filters the batches by user_id
    ): Response<List<BatchX>>

    @DELETE("/rest/v1/batch")
    suspend fun deleteBatch(
        @Query("batch_id") batchId: String, // eg. "eq.2"
    ): Response<Unit>

    @GET("/rest/v1/User")
    suspend fun getRequestedUsers(
        @Query("select") select: String = "*,batchstudent!inner(batch_id,status)",
        @Query("batchstudent.batch_id") batchId: String,
        @Query("batchstudent.status") status: String = "eq.requested"
    ): Response<List<User>>

    @PATCH("rest/v1/batchstudent")
    suspend fun updateRequestStatus(
        @Query("batch_id") batchId: String,         // should be "eq.123"
        @Query("student_id") studentId: String,     // should be "eq.456"
        @Header("Prefer") prefer: String = "return=minimal",
        @Body body: Map<String, String>             // e.g., mapOf("status" to "approved")
    ): Response<Unit>

    @PATCH("rest/v1/batchstudent")
    suspend fun removeStudentFromBatch(
        @Query("batch_id") batchIdFilter: String = "eq.{batchId}",
        @Query("student_id") studentIdFilter: String = "eq.{studentId}",
        @Body update: Map<String, String> = mapOf("status" to "removed")
    ): Response<List<Any>>

    @GET("rest/v1/form")
    suspend fun getQuizForUser(
        @Query("created_by") userId : String
    ) : Response<List<QuizX>>

    @GET("rest/v1/form")
    suspend fun getQuizInBatch(
        @Query("select") select: String = "*,batchform!inner(batch_id)",
        @Query("batchform.batch_id") batchId: String
    ): Response<List<QuizX>>

    @GET("/rest/v1/assignment")
    suspend fun getAssignmentsInBatch(
        @Query("select") select: String = "*,batchassignment!inner(batch_id)",
        @Query("batchassignment.batch_id") batchId: String
    ): Response<List<Assignment>>

    @POST
    suspend fun uploadPdfToStorage(
        @Url url: String,
        @Header("Content-Type") contentType: String = "application/pdf",
        @Body fileBody: RequestBody
    ): Response<ResponseBody>

    @POST
    suspend fun uploadImageToStorage(
        @Url url: String,
        @Header("Content-Type") contentType: String = "image/jpg", // or "image/png"
        @Header("Authorization") token : String,
        @Body imageBody: RequestBody
    ): Response<ResponseBody>

    @POST
    suspend fun uploadImageToStorageProfile(
        @Url url: String,
        @Header("Content-Type") contentType: String = "image/jpg", // or "image/png"
        @Body imageBody: RequestBody
    ): Response<ResponseBody>

    @PATCH("/rest/v1/User")
    suspend fun updateUser(
        @Query("user_id") userId: String,
        @Header("Prefer") prefer: String = "return=representation",
        @Body updatedFields: Map<String, @JvmSuppressWildcards Any>
    ): Response<List<User>>

    @PATCH("/rest/v1/teacherprofile")
    suspend fun updateTeacher(
        @Query("teacher_id") id: String,
        @Header("Prefer") prefer: String = "return=representation",
        @Body updatedFields: Map<String, @JvmSuppressWildcards Any>
    ): Response<List<TeacherProfile>>

    @POST("rest/v1/assignment")
    suspend fun createAssignment(
        @Body assignment: Assignment,
        @Header("Prefer") prefer: String = "return=representation",
    ): Response<List<Assignment>>

    @POST("rest/v1/batchassignment")
    suspend fun addBatchAssignments(@Body pairs: List<BatchAssignment?>): Response<Unit>

    @POST("rest/v1/batchform")
    suspend fun addBatchForm(@Body pairs: List<BatchForm?>): Response<Unit>

    @GET("rest/v1/teacherprofile")
    suspend fun getTeacher(
        @Query("teacher_id") teacherId : String
    ) : Response<List<TeacherProfile>>

    @GET("/rest/v1/response")
    suspend fun getStudent(
        @Query("select") select: String = "*,User!inner(*)",
        @Query("form_id") formId: String
    ): Response<List<com.app.quizparikshainstitute.model.Response>>
    @POST("rest/v1/form")
    suspend fun uploadForm(
        @Body form: QuizX,
        @Header("Prefer") prefer: String = "return=representation"
    ): Response<List<QuizX>>

    @POST("rest/v1/question")
    suspend fun insertQuestion(
        @Body question: Question,
        @Header("Prefer") prefer: String = "return=representation"
    ): Response<List<Question>>

    @POST("rest/v1/questiontext")
    suspend fun insertQuestionTexts(
        @Body texts: List<QuestionText>
    ): Response<Unit>

    @POST("rest/v1/option")
    suspend fun insertOption(
        @Body option: Option,
        @Header("Prefer") prefer: String = "return=representation"
    ): Response<List<Option>>

    @POST("rest/v1/optiontext")
    suspend fun insertOptionTexts(
        @Body texts: List<OptionText>
    ): Response<Unit>


    @POST("rest/v1/announcement")
    suspend fun createAnnouncement(
        @Body announcement: Announcement,
        @Header("Prefer") prefer: String = "return=representation"
    ): Response<List<Announcement>>

    @GET("rest/v1/announcement")
    suspend fun getAnnouncements(
        @Query("batch_id") batchId: String
    ): Response<List<Announcement>>

    @GET("/rest/v1/rpc/get_user_rank")
    suspend fun getUserRank(
        @Query("form_id_input") formId: Long,
        @Query("user_id_input") userId: Long
    ): Response<List<UserRankResult>>

    @GET("/rest/v1/response")
    suspend fun getUserResponsesWithForm(
        @Query("select") select: String = "*,form(*)",
        @Query("user_id") userId: String,
        @Query("order") order: String = "submitted_at.desc"
    ): Response<List<ResponseWithForm>>

    @GET("/rest/v1/batchteacher")
    suspend fun getBatchesTeacherByUser(
        @Query("select") select: String = "*,batch(*)",
        @Query("teacher_id") createdBy : String
    ) : Response<List<BatchTeacher>>

    @POST("/functions/v1/upload_quiz")
    suspend fun insertQuizForm(
        @Body payload: QuizFormUploadPayload
    ): Response<UploadResult>

    @POST("/functions/v1/send-notification")
    suspend fun sendNotification(
        @Body body: Map<String, String>
    )

    @GET("/rest/v1/answer")
    suspend fun getAnswersByResponseId(
        @Query("select") select: String = "question_id,option_id",
        @Query("response_id") responseId: String
    ): Response<List<QuestionAnswer>>

    @POST("/rest/v1/rpc/get_form_questions_bilingual")
    suspend fun getFormQuestion(
        @Body body: Map<String, Long>
    ) : Response<FormWithQuestion>

    @POST("/rest/v1/batchteacher")
    suspend fun addTeacher(
        @Body body: Map<String, Long>
    ) : Response<Unit>

    @GET("/rest/v1/User")
    suspend fun getTeacherByEmail(
        @Query("email") email : String
    ) : Response<List<User>>

    @GET("/rest/v1/batchteacher")
    suspend fun getBatchAdminStatus(
        @Query("teacher_id") teacherId : String,
        @Query("batch_id") batchId : String
    ) : Response<List<BatchTeacher>>


}
