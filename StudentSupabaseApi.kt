package com.app.quizcal.data.api

import com.app.quizcal.model.Announcement
import com.app.quizcal.model.Assignment
import com.app.quizcal.model.AuthResponse
import com.app.quizcal.model.Book
import com.app.quizcal.model.FormWithQuestion
import com.app.quizcal.model.PaymentOrder
import com.app.quizcal.model.QuestionAnswer
import com.app.quizcal.model.Quiz
import com.app.quizcal.model.ResponseWithForm
import com.app.quizcal.model.SubjectResponse
import com.app.quizcal.model.SubmitResponseRequest
import com.app.quizcal.model.User
import com.app.quizcal.model.UserRankResult
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.Url

interface SupabaseApi {
    @POST("/functions/v1/create-user")
    suspend fun signUp(
        @Body body: Map<String, String>,
    ): Response<AuthResponse>

    @POST("/functions/v1/student-login")
    suspend fun login(
        @Body body: Map<String, String>,
    ): Response<ResponseBody>

    @POST("/rest/v1/User")
    suspend fun insertUser(
        @Body user: User,
        @Header("Prefer") preferHeader: String = "return=representation"
    ): Response<List<User>>

    @GET("/rest/v1/User")
    suspend fun getUserBySupabaseId(
        @Query("id") id: String, // 'id' column = supabase_user_id
    ): Response<List<User>>

    @GET("/rest/v1/User")
    suspend fun getUserByUserId(
        @Query("user_id") id: String, // 'id' column = supabase_user_id
    ): Response<List<User>>

    @GET("/rest/v1/batch")
    suspend fun getBatchWithTeacherProfile(
        @Query("select") select: String = "*,created_by(*,teacherprofile(*))",
        @Query("batch_code") batchCode: String
    ): Response<ResponseBody>

    @POST("/rest/v1/batchstudent")
    suspend fun addBatchStudent(
        @Body body: Map<String, Long>,
    ) : Response<Unit>

    @GET("/rest/v1/batchstudent")
    suspend fun getApprovedBatchesForStudent(
        @Query("select") select: String = "*,batch(*,created_by(*,teacherprofile(*)))",
        @Query("student_id") studentId: String, // e.g. "eq.123"
        @Query("status") status: String = "eq.approved"
    ): Response<ResponseBody>

    @GET("rest/v1/form")
    suspend fun getQuizInBatch(
        @Query("select") select: String = "*,batchform!inner(batch_id)",
        @Query("batchform.batch_id") batchId: String,
        @Query("order") order: String = "created_at.desc"
    ): Response<List<Quiz>>

    @GET("rest/v1/form")
    suspend fun getQuizClassSubject(
        @Query("quiz_type") quizType : String,
//        @Query("class") className : String,
//        @Query("subject") subject : String,
        @Query("order") order: String = "created_at.desc"
    ): Response<List<Quiz>>

    @GET("rest/v1/announcement")
    suspend fun getAnnouncements(
        @Query("batch_id") batchId: String,
        @Query("order") order: String = "posted_at.desc"
    ): Response<List<Announcement>>

    @GET("/rest/v1/assignment")
    suspend fun getAssignmentsInBatch(
        @Query("select") select: String = "*,batchassignment!inner(batch_id)",
        @Query("batchassignment.batch_id") batchId: String,
        @Query("order") order: String = "posted_at.desc"
    ): Response<List<Assignment>>

    @POST("/rest/v1/rpc/get_distinct_subjects_by_class")
    suspend fun getDistinctSubjects(
        @Body body: Map<String, String>
    ): Response<List<SubjectResponse>>

    @PATCH("/rest/v1/User")
    suspend fun updateUser(
        @Query("user_id") userId: String,
        @Header("Prefer") prefer: String = "return=representation",
        @Body updatedFields: Map<String, @JvmSuppressWildcards Any>
    ): Response<List<User>>

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

    @POST("/rest/v1/rpc/get_form_questions_bilingual")
    suspend fun getFormQuestion(
        @Body body: Map<String, Long>
    ) : Response<FormWithQuestion>

    @POST("/rest/v1/rpc/submit_quiz_response")
    suspend fun submitResponse(@Body request: SubmitResponseRequest): Response<Unit>

    @GET("/rest/v1/response")
    suspend fun getUserResponsesWithForm(
        @Query("select") select: String = "*,form(*)",
        @Query("user_id") userId: String,
        @Query("order") order: String = "submitted_at.desc"
    ): Response<List<ResponseWithForm>>

    @GET("/rest/v1/response")
    suspend fun getResponsesWithFormByFormId(
        @Query("select") select: String = "*,form(*)",
        @Query("user_id") userId: String,
        @Query("form_id") formId: String,
        @Query("order") order: String = "submitted_at.desc"
    ): Response<List<ResponseWithForm>>

//    @GET("/rest/v1/response")
//    suspend fun getResponsesWithFormByFormId(
//        @Query("form_id") formId: String,
//        @Query("user_id") userId: String,
//        @Query("order") order: String = "submitted_at.desc"
//    ): Response<List<ResponseWithForm>>

    @GET("/rest/v1/answer")
    suspend fun getAnswersByResponseId(
        @Query("select") select: String = "question_id,option_id",
        @Query("response_id") responseId: String
    ): Response<List<QuestionAnswer>>

    @GET("/rest/v1/rpc/get_user_rank")
    suspend fun getUserRank(
        @Query("form_id_input") formId: Long,
        @Query("user_id_input") userId: Long
    ): Response<List<UserRankResult>>

    @POST("/rest/v1/rpc/get_server_time")
    suspend fun getServerTime(): Response<String>

    @GET("/rest/v1/response")
    suspend fun getResponseEntry(
        @Query("select") select: String = "response_id",
        @Query("form_id") formId: String,
        @Query("user_id") userId: String
    ): Response<List<Map<String, Any>>>

    @GET("rest/v1/books")
    suspend fun getAllBooks(
        @Query("select") select: String = "*"
    ): Response<List<Book>>

    @PATCH("rest/v1/User")
    suspend fun updateToken(
        @Query("user_id") userId : String,
        @Body body: Map<String, String>,
    ) : Response<Unit>

    @GET("/rest/v1/response")
    suspend fun getUserAttempts(
        @Query("select") select: String = "form_id",
        @Query("user_id") userId: String,
        @Query("form_id") formIdFilter: String
    ): Response<List<Map<String, Any>>>


    @GET("/rest/v1/user_form_access")
    suspend fun getUserFormAccess(
        @Query("select") select: String = "form_id",
        @Query("form_id") formId: String,
        @Query("user_id") userId: String,
        @Query("revoked") revoked: String
    ): Response<List<Map<String, Any>>>

    @POST("/functions/v1/create-razorpay-order")
    suspend fun createOrder(
        @Body body: Map<String, Long>
    ): Response<PaymentOrder>

}