-- CreateIndex
CREATE INDEX "availability_slots_tutorProfileId_date_idx" ON "availability_slots"("tutorProfileId", "date");

-- CreateIndex
CREATE INDEX "availability_slots_isBooked_idx" ON "availability_slots"("isBooked");

-- CreateIndex
CREATE INDEX "bookings_studentId_idx" ON "bookings"("studentId");

-- CreateIndex
CREATE INDEX "bookings_tutorProfileId_idx" ON "bookings"("tutorProfileId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "tutor_categories_tutorProfileId_idx" ON "tutor_categories"("tutorProfileId");

-- CreateIndex
CREATE INDEX "tutor_categories_categoryId_idx" ON "tutor_categories"("categoryId");

-- CreateIndex
CREATE INDEX "tutor_profiles_hourlyRate_idx" ON "tutor_profiles"("hourlyRate");

-- CreateIndex
CREATE INDEX "tutor_profiles_rating_idx" ON "tutor_profiles"("rating");
