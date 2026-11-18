-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: employee-monitering
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` varchar(191) NOT NULL,
  `activityType` enum('ACTIVE','IDLE','MANUAL','SYSTEM','BREAK') NOT NULL DEFAULT 'ACTIVE',
  `productivity` enum('PRODUCTIVE','NEUTRAL','UNPRODUCTIVE') NOT NULL DEFAULT 'NEUTRAL',
  `duration` int(11) NOT NULL DEFAULT 0,
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `appWebsite` varchar(191) DEFAULT 'Unknown',
  `employeeId` varchar(191) NOT NULL,
  `taskId` varchar(191) DEFAULT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_employeeId_fkey` (`employeeId`),
  KEY `activity_logs_taskId_fkey` (`taskId`),
  KEY `activity_logs_organizationId_fkey` (`organizationId`),
  CONSTRAINT `activity_logs_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `activity_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `activity_logs_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES ('34b2ce45-1e6b-4168-9c8e-ab6fc6a488d8','ACTIVE','NEUTRAL',38,'2026-11-17 10:47:19.963','Web Dashboard (Task Complete)','b93a4d90-2454-4694-8edd-dcbb7e408098',NULL,'default-org-id','2026-11-17 10:47:19.964','2026-11-17 10:47:19.964');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `advanced_tracking_settings`
--

DROP TABLE IF EXISTS `advanced_tracking_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `advanced_tracking_settings` (
  `id` varchar(191) NOT NULL,
  `shiftThreshold` int(11) NOT NULL DEFAULT 4,
  `strictTime` tinyint(1) NOT NULL DEFAULT 0,
  `inactivityPopups` tinyint(1) NOT NULL DEFAULT 1,
  `identificationMode` varchar(191) NOT NULL DEFAULT 'hwid',
  `showEngagement` tinyint(1) NOT NULL DEFAULT 0,
  `useActiveDirectory` tinyint(1) NOT NULL DEFAULT 1,
  `adEmail` tinyint(1) NOT NULL DEFAULT 1,
  `adTeam` tinyint(1) NOT NULL DEFAULT 1,
  `adTrackingSettings` tinyint(1) NOT NULL DEFAULT 0,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `advanced_tracking_settings_organizationId_key` (`organizationId`),
  CONSTRAINT `advanced_tracking_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `advanced_tracking_settings`
--

LOCK TABLES `advanced_tracking_settings` WRITE;
/*!40000 ALTER TABLE `advanced_tracking_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `advanced_tracking_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agents`
--

DROP TABLE IF EXISTS `agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `agents` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `deviceId` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'inactive',
  `systemInfo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`systemInfo`)),
  `lastSeen` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agents_employeeId_key` (`employeeId`),
  UNIQUE KEY `agents_deviceId_key` (`deviceId`),
  CONSTRAINT `agents_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agents`
--

LOCK TABLES `agents` WRITE;
/*!40000 ALTER TABLE `agents` DISABLE KEYS */;
INSERT INTO `agents` VALUES ('539ffe5d-e3f9-44c9-ab36-25d627555427','f91283ce-1bc8-4c4b-95f1-0637b2e997fd','DEV-ABCKUM-F912','active','{\"platform\":\"win32\",\"release\":\"10.0.19045\",\"arch\":\"x64\",\"hostname\":\"DESKTOP-ABCKUM\"}','2026-11-18 05:46:46.272','2026-11-17 09:50:22.567','2026-11-18 05:46:46.274'),('b3493ed2-d19a-4c19-8584-43670aa7000a','656bfb4e-4f15-4da2-bc93-16d57b5b2093','DEV-EMPLOY-656B','active','{\"platform\":\"win32\",\"release\":\"10.0.19045\",\"arch\":\"x64\",\"hostname\":\"DESKTOP-EMPLOY\"}','2026-11-18 05:46:46.258','2026-11-17 13:18:22.582','2026-11-18 05:46:46.261'),('ba602fc5-a1f9-4213-8648-64be6beaecef','dec4a6b8-c082-4ce2-b525-3b7a545317ee','DEVICE123','active','{\"platform\":\"win32\",\"release\":\"10.0\",\"arch\":\"x64\"}','2026-05-22 14:09:34.402','2026-05-22 14:09:34.404','2026-05-22 14:09:34.404'),('d8d7377a-7ac7-4596-8013-d22de726e69c','b93a4d90-2454-4694-8edd-dcbb7e408098','DEV-ALEXEM-B93A','active','{\"platform\":\"win32\",\"release\":\"10.0.19045\",\"arch\":\"x64\",\"hostname\":\"DESKTOP-ALEXEM\"}','2026-11-18 05:49:09.508','2026-04-04 13:37:21.592','2026-11-18 05:49:09.509');
/*!40000 ALTER TABLE `agents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alert_logs`
--

DROP TABLE IF EXISTS `alert_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alert_logs` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `ruleType` varchar(191) NOT NULL,
  `trigger` varchar(191) NOT NULL,
  `severity` varchar(191) NOT NULL DEFAULT 'warning',
  `message` text NOT NULL,
  `screenshotUrl` longtext DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `resolved` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `alert_logs_organizationId_createdAt_idx` (`organizationId`,`createdAt`),
  KEY `alert_logs_employeeId_createdAt_idx` (`employeeId`,`createdAt`),
  CONSTRAINT `alert_logs_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `alert_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alert_logs`
--

LOCK TABLES `alert_logs` WRITE;
/*!40000 ALTER TABLE `alert_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `alert_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alert_rules`
--

DROP TABLE IF EXISTS `alert_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alert_rules` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `trigger` varchar(191) NOT NULL,
  `scope` varchar(191) NOT NULL DEFAULT 'All Employees',
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `alert_rules_organizationId_fkey` (`organizationId`),
  CONSTRAINT `alert_rules_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alert_rules`
--

LOCK TABLES `alert_rules` WRITE;
/*!40000 ALTER TABLE `alert_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `alert_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alert_settings`
--

DROP TABLE IF EXISTS `alert_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alert_settings` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `earliestClockIn` int(11) NOT NULL DEFAULT 15,
  `latestClockOut` int(11) NOT NULL DEFAULT 30,
  `tolerance` int(11) NOT NULL DEFAULT 10,
  `absentInApp` tinyint(1) NOT NULL DEFAULT 1,
  `absentEmail` tinyint(1) NOT NULL DEFAULT 0,
  `headcountEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `headcountLateThreshold` int(11) NOT NULL DEFAULT 15,
  `headcountSendAfter` varchar(191) NOT NULL DEFAULT 'scheduled_time',
  `headcountInApp` tinyint(1) NOT NULL DEFAULT 1,
  `headcountEmail` tinyint(1) NOT NULL DEFAULT 0,
  `productivityLabeling` varchar(191) NOT NULL DEFAULT 'daily',
  `manualTimeEntries` varchar(191) NOT NULL DEFAULT 'daily',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `alert_settings_organizationId_key` (`organizationId`),
  CONSTRAINT `alert_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alert_settings`
--

LOCK TABLES `alert_settings` WRITE;
/*!40000 ALTER TABLE `alert_settings` DISABLE KEYS */;
INSERT INTO `alert_settings` VALUES ('31027012-980e-447f-95d2-d3a877101d3f','default-org-id',15,30,10,1,0,1,15,'scheduled_time',1,0,'daily','daily','2026-11-16 06:59:59.603','2026-11-16 06:59:59.603');
/*!40000 ALTER TABLE `alert_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_usage_logs`
--

DROP TABLE IF EXISTS `app_usage_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_usage_logs` (
  `id` varchar(191) NOT NULL,
  `appName` varchar(191) NOT NULL,
  `domain` varchar(191) NOT NULL DEFAULT '',
  `category` varchar(191) NOT NULL DEFAULT 'Uncategorized',
  `productivity` enum('PRODUCTIVE','NEUTRAL','UNPRODUCTIVE') NOT NULL DEFAULT 'NEUTRAL',
  `duration` int(11) NOT NULL DEFAULT 0,
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `app_usage_logs_employeeId_fkey` (`employeeId`),
  KEY `app_usage_logs_organizationId_fkey` (`organizationId`),
  CONSTRAINT `app_usage_logs_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `app_usage_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_usage_logs`
--

LOCK TABLES `app_usage_logs` WRITE;
/*!40000 ALTER TABLE `app_usage_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `app_usage_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance` (
  `id` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `clockIn` datetime(3) NOT NULL,
  `clockOut` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PRESENT',
  `late` tinyint(1) NOT NULL DEFAULT 0,
  `duration` int(11) NOT NULL DEFAULT 0,
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `attendance_employeeId_fkey` (`employeeId`),
  KEY `attendance_organizationId_fkey` (`organizationId`),
  CONSTRAINT `attendance_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `attendance_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES ('029ba14b-fed9-45b3-82cc-0d52e0c7e2bf','2026-07-06','2026-07-06 16:08:26.000','2026-07-07 00:50:45.000','PRESENT',0,31339,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:32.947','2026-07-25 07:26:32.947'),('02c8f9a6-7ae9-49e5-b385-3350185ae418','2026-07-18','2026-07-18 16:14:29.000','2026-07-19 00:37:42.000','PRESENT',1,30193,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:37.248','2026-07-25 07:26:37.248'),('02ffb0a8-26b9-4984-ab5e-8d12a4d1b43e','2026-06-27','2026-06-27 16:13:21.000','2026-06-28 00:56:41.000','PRESENT',1,31400,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:30.587','2026-07-25 07:26:30.587'),('0360176e-4458-4d85-a49b-09a12f85fcca','2026-07-01','2026-07-01 16:14:55.000','2026-07-02 00:41:12.000','PRESENT',1,30377,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:32.103','2026-07-25 07:26:32.103'),('059fbbb7-4622-4c50-88ea-3c21abed1457','2026-07-09','2026-07-09 16:03:36.000','2026-07-10 00:54:45.000','PRESENT',0,31869,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:34.420','2026-07-25 07:26:34.420'),('07e45257-a9f0-4d63-8615-380c7a3bf2ce','2026-06-26','2026-06-26 16:12:08.000','2026-06-27 00:48:23.000','PRESENT',1,30975,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:07:34.785','2026-07-25 07:07:34.785'),('090be29f-4836-4a52-b89f-c9f95d8e0abf','2026-07-15','2026-07-15 16:13:27.000','2026-07-16 00:30:45.000','PRESENT',1,29838,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:36.204','2026-07-25 07:26:36.204'),('0e5aaec0-8afd-4f32-a8f1-1a5c4f641337','2026-07-15','2026-07-15 16:05:21.000','2026-07-16 00:33:14.000','PRESENT',0,30473,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:36.281','2026-07-25 07:26:36.281'),('0f6ce26a-fb35-41dc-9677-b41b7a80e9b4','2026-07-06','2026-07-06 16:09:00.000','2026-07-07 00:58:13.000','PRESENT',0,31753,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:33.273','2026-07-25 07:26:33.273'),('11e6b170-0a96-4c85-ac59-44ce976616f5','2026-06-29','2026-06-29 16:01:43.000','2026-06-30 00:35:26.000','PRESENT',0,30823,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:30.861','2026-07-25 07:26:30.861'),('13b40a3b-deb8-4200-b515-ed6137f67f0b','2026-07-21','2026-07-21 16:00:02.000','2026-07-22 00:30:15.000','PRESENT',0,30613,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:37.953','2026-07-25 07:26:37.953'),('158a7958-b12f-44be-9d8c-3deac9191df5','2026-11-18','2026-11-18 06:59:02.280','2026-11-18 06:59:32.706','PRESENT',0,30,'656bfb4e-4f15-4da2-bc93-16d57b5b2093','b27957c7-9430-450b-ab74-9f86dbdaec02','2026-11-18 06:59:02.297','2026-11-18 06:59:32.716'),('16622f46-a78a-451a-8482-4ed9e5f1d72c','2026-07-01','2026-07-01 16:07:33.000','2026-07-02 00:54:11.000','PRESENT',0,31598,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:31.696','2026-07-25 07:26:31.696'),('181cedbd-7dfc-4a46-998f-cf3b3bd3a1bd','2026-06-30','2026-06-30 16:05:02.000','2026-07-01 00:59:04.000','PRESENT',0,32042,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:31.476','2026-07-25 07:26:31.476'),('19cb009c-8d10-4e6a-8c76-6a2e3380c7cc','2026-07-22','2026-07-22 16:00:25.000','2026-07-23 00:36:23.000','PRESENT',0,30958,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:38.216','2026-07-25 07:26:38.216'),('1bdb51ab-ea29-4c65-8580-1a171d5ff687','2026-11-18','2026-11-18 05:53:57.177',NULL,'PRESENT',0,0,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-11-18 05:53:57.188','2026-11-18 05:53:57.188'),('2048f308-326f-458a-ad3f-526919daf526','2026-07-15','2026-07-15 16:06:54.000','2026-07-16 00:45:07.000','PRESENT',0,31093,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:36.009','2026-07-25 07:26:36.009'),('22e685ae-0f7f-4eb4-86bb-07a905f0784b','2026-07-10','2026-07-10 16:08:40.000','2026-07-11 00:49:44.000','PRESENT',0,31264,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:34.532','2026-07-25 07:26:34.532'),('235069b8-e3b8-471b-a82c-e9e0ddf08cf4','2026-07-03','2026-07-03 16:08:55.000','2026-07-04 00:50:39.000','PRESENT',0,31304,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:32.772','2026-07-25 07:26:32.772'),('298b37c4-0f3c-4e00-ab19-4da19ac1a68d','2026-07-23','2026-07-23 16:00:02.000','2026-07-24 00:44:47.000','PRESENT',0,31485,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:38.618','2026-07-25 07:26:38.618'),('2a76a41f-b499-4ad9-aa15-0857331eec53','2026-06-29','2026-06-29 16:01:04.000','2026-06-30 00:52:06.000','PRESENT',0,31862,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:31.149','2026-07-25 07:26:31.149'),('2ad18fe7-b717-4e7b-9c2e-b9e1e9b9cd7f','2026-07-14','2026-07-14 16:13:25.000','2026-07-15 00:57:30.000','PRESENT',1,31445,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:35.605','2026-07-25 07:26:35.605'),('31056d7b-5582-4bfe-9139-b9643f0ee397','2026-07-13','2026-07-13 16:01:11.000','2026-07-14 00:56:27.000','PRESENT',0,32116,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:35.304','2026-07-25 07:26:35.304'),('3776cfbe-68a7-466c-b831-ed72871ffff1','2026-06-29','2026-06-29 16:11:02.000','2026-06-30 00:50:38.000','PRESENT',1,31176,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:31.068','2026-07-25 07:26:31.068'),('39eb925f-3230-4594-953b-9656a8a2bdec','2026-07-07','2026-07-07 16:05:01.000','2026-07-08 00:43:05.000','PRESENT',0,31084,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:33.771','2026-07-25 07:26:33.771'),('3a04cf95-ddd5-4525-8533-a5a42b24ca67','2026-06-26','2026-06-26 16:06:06.000','2026-06-27 00:45:45.000','PRESENT',0,31179,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:07:35.071','2026-07-25 07:07:35.071'),('3af7e533-26e7-48b3-8043-24a4f86c4970','2026-07-14','2026-07-14 16:03:41.000','2026-07-15 00:57:25.000','PRESENT',0,32024,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:35.546','2026-07-25 07:26:35.546'),('3b185791-6766-4313-a4d8-23bf6d3adb48','2026-07-20','2026-07-20 16:00:45.000','2026-07-21 00:30:25.000','PRESENT',0,30580,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:37.477','2026-07-25 07:26:37.477'),('3be6b969-d0bb-4133-8be5-db7d241c86b3','2026-07-24','2026-07-24 16:03:23.000','2026-07-25 00:33:58.000','PRESENT',0,30635,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:38.858','2026-07-25 07:26:38.858'),('3cb47af8-8354-4775-a562-e21f1b9a9f20','2026-07-16','2026-07-16 16:05:06.000','2026-07-17 00:37:43.000','PRESENT',0,30757,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:36.664','2026-07-25 07:26:36.664'),('3cc3608d-bae6-4647-b5eb-9b321c692776','2026-07-13','2026-07-13 16:02:15.000','2026-07-14 00:50:55.000','PRESENT',0,31720,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:35.096','2026-07-25 07:26:35.096'),('3d9d2d76-9a42-45fd-b91e-68b8e8b3c933','2026-06-30','2026-06-30 16:12:57.000','2026-07-01 00:39:01.000','PRESENT',1,30364,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:31.560','2026-07-25 07:26:31.560'),('3ff7b2b5-ce09-4e62-99a6-b1c04cbe0c36','2026-07-12','2026-07-12 16:08:54.000','2026-07-13 00:37:22.000','PRESENT',0,30508,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:35.021','2026-07-25 07:26:35.021'),('4176e4bb-fbba-4edb-8c84-99d7a7fed875','2026-06-26','2026-06-26 16:09:38.000','2026-06-27 00:59:07.000','PRESENT',0,31769,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:07:35.150','2026-07-25 07:07:35.150'),('42aad063-063e-4aa6-9710-eb08759f69e8','2026-07-13','2026-07-13 16:13:07.000','2026-07-14 00:41:21.000','PRESENT',1,30494,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:35.403','2026-07-25 07:26:35.403'),('44c6dd2f-0793-4c5f-b8d5-78f67f673063','2026-07-23','2026-07-23 16:02:43.000','2026-07-24 00:37:27.000','PRESENT',0,30884,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:38.497','2026-07-25 07:26:38.497'),('47d11253-fe72-4a52-a851-d35356642edb','2026-07-09','2026-07-09 16:12:30.000','2026-07-10 00:36:46.000','PRESENT',1,30256,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:34.240','2026-07-25 07:26:34.240'),('4a69aa34-ef83-46f2-b0de-b79c4867f3b6','2026-07-20','2026-07-20 16:14:22.000','2026-07-21 00:44:00.000','PRESENT',1,30578,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:37.687','2026-07-25 07:26:37.687'),('4e8a32b9-e61c-4898-a784-58066ab14a56','2026-07-22','2026-07-22 16:12:17.000','2026-07-23 00:42:43.000','PRESENT',1,30626,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:38.425','2026-07-25 07:26:38.425'),('51cc7d05-ffb1-48c6-ba2a-88aefef71bfd','2026-07-05','2026-07-05 16:10:39.000','2026-07-06 00:30:56.000','PRESENT',0,30017,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:32.890','2026-07-25 07:26:32.890'),('563b97de-2dd4-4d13-913e-0229c2bd8daf','2026-06-26','2026-06-26 16:06:06.000','2026-06-27 00:45:45.000','PRESENT',0,31179,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:30.319','2026-07-25 07:26:30.319'),('581c3a39-7160-4859-b1fd-779521cfccb4','2026-06-26','2026-06-26 16:10:38.000','2026-06-27 00:36:04.000','PRESENT',0,30326,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:07:34.899','2026-07-25 07:07:34.899'),('594c2e2e-ee0d-4b36-8052-7985bbcb6550','2026-07-24','2026-07-24 16:10:15.000','2026-07-25 00:43:42.000','PRESENT',0,30807,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:38.774','2026-07-25 07:26:38.774'),('5c9ae9d0-793c-4853-81aa-f4580cd6b416','2026-07-02','2026-07-02 16:13:23.000','2026-07-03 00:36:28.000','PRESENT',1,30185,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:32.470','2026-07-25 07:26:32.470'),('5d59bc81-14de-4e30-8aed-229287352a1b','2026-06-29','2026-06-29 16:13:41.000','2026-06-30 00:42:19.000','PRESENT',1,30518,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:31.214','2026-07-25 07:26:31.214'),('5e7ab2f5-3a53-4a1e-8a16-031e3f954a4e','2026-06-26','2026-06-26 16:09:38.000','2026-06-27 00:59:07.000','PRESENT',0,31769,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:30.409','2026-07-25 07:26:30.409'),('62710372-2b09-4006-aedf-a7fc49e5dd8c','2026-07-07','2026-07-07 16:10:44.000','2026-07-08 00:55:30.000','PRESENT',0,31486,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:33.515','2026-07-25 07:26:33.515'),('68196451-b7b7-4542-86a3-9b772ab14c38','2026-07-06','2026-07-06 16:04:21.000','2026-07-07 00:30:26.000','PRESENT',0,30365,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:33.348','2026-07-25 07:26:33.348'),('6a0de40b-7ee8-48b9-82ea-c96f0ff02b15','2026-07-17','2026-07-17 16:01:14.000','2026-07-18 00:51:29.000','PRESENT',0,31815,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:37.052','2026-07-25 07:26:37.052'),('6a58f3b3-5e21-4ab3-8321-60a9e85822aa','2026-07-13','2026-07-13 16:13:15.000','2026-07-14 00:41:46.000','PRESENT',1,30511,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:35.487','2026-07-25 07:26:35.487'),('711a253d-7123-4d69-81e8-839d03e15261','2026-06-30','2026-06-30 16:08:30.000','2026-07-01 00:32:59.000','PRESENT',0,30269,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:31.284','2026-07-25 07:26:31.284'),('77077ad1-4149-47e2-8679-cba8cfddf0f4','2026-07-14','2026-07-14 16:03:22.000','2026-07-15 00:53:52.000','PRESENT',0,31830,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:35.866','2026-07-25 07:26:35.866'),('7a28091c-a38c-4b71-9e68-49969c08e561','2026-07-16','2026-07-16 16:11:52.000','2026-07-17 00:58:29.000','PRESENT',1,31597,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:36.728','2026-07-25 07:26:36.728'),('7a8106e2-338e-4976-8762-a49979db23f8','2026-06-27','2026-06-27 16:02:36.000','2026-06-28 00:41:32.000','PRESENT',0,31136,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:30.498','2026-07-25 07:26:30.498'),('814ea19c-005d-406c-948a-b3373d291576','2026-07-01','2026-07-01 16:02:03.000','2026-07-02 00:36:25.000','PRESENT',0,30862,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:31.906','2026-07-25 07:26:31.906'),('8150f40a-6b43-46c7-bfaa-d4848df596f1','2026-06-30','2026-06-30 16:04:36.000','2026-07-01 00:43:08.000','PRESENT',0,31112,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:31.623','2026-07-25 07:26:31.623'),('833571a6-9a61-4905-a1b8-acc4a750eac2','2026-11-16','2026-11-16 09:19:25.172','2026-11-16 11:57:27.218','PRESENT',0,9482,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-11-16 09:19:25.196','2026-11-16 11:57:27.224'),('87990ecc-183f-472d-b451-d2f26b0edaf1','2026-07-14','2026-07-14 16:01:22.000','2026-07-15 00:40:06.000','PRESENT',0,31124,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:35.802','2026-07-25 07:26:35.802'),('87d02f8a-c7d6-48fb-92f2-da71ca50698b','2026-07-23','2026-07-23 16:04:24.000','2026-07-24 00:51:53.000','PRESENT',0,31649,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:38.697','2026-07-25 07:26:38.697'),('8db4d973-5714-4a10-9f7b-1f6b625b1801','2026-06-26','2026-06-26 16:10:38.000','2026-06-27 00:36:04.000','PRESENT',0,30326,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:30.142','2026-07-25 07:26:30.142'),('90218a66-d560-4db9-bc1e-5a2818a2d028','2026-07-02','2026-07-02 16:11:05.000','2026-07-03 00:42:17.000','PRESENT',1,30672,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:32.227','2026-07-25 07:26:32.227'),('91bca28a-10d0-4d22-a2fe-a95035c326b1','2026-07-13','2026-07-13 16:11:52.000','2026-07-14 00:42:54.000','PRESENT',1,30662,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:35.171','2026-07-25 07:26:35.171'),('97558804-a0f2-4abc-a630-9accb15ff427','2026-07-08','2026-07-08 16:11:50.000','2026-07-09 00:45:12.000','PRESENT',1,30802,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:33.898','2026-07-25 07:26:33.898'),('97649dae-4553-4892-9705-c80d2d5132b6','2026-07-01','2026-07-01 16:05:47.000','2026-07-02 00:32:25.000','PRESENT',0,30398,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:31.762','2026-07-25 07:26:31.762'),('99d050ee-a2f1-486b-9a7d-f999b903784c','2026-07-07','2026-07-07 16:00:56.000','2026-07-08 00:36:36.000','PRESENT',0,30940,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:33.718','2026-07-25 07:26:33.718'),('9bec6d15-a0de-4ea2-bbb6-03d046968c25','2026-07-22','2026-07-22 16:13:10.000','2026-07-23 00:51:15.000','PRESENT',1,31085,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:38.137','2026-07-25 07:26:38.137'),('9fafb6cc-e71e-46f9-b7ed-f861387c220b','2026-07-10','2026-07-10 16:03:02.000','2026-07-11 00:40:08.000','PRESENT',0,31026,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:34.471','2026-07-25 07:26:34.471'),('9fd3d2ae-5da3-42e6-ae3b-29561a8bbe8d','2026-07-21','2026-07-21 16:05:29.000','2026-07-22 00:30:02.000','PRESENT',0,30273,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:38.017','2026-07-25 07:26:38.017'),('a0473c19-92be-4d0d-8c24-5ec1a82d5095','2026-07-17','2026-07-17 16:07:07.000','2026-07-18 00:52:02.000','PRESENT',0,31495,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:36.860','2026-07-25 07:26:36.860'),('a23cc4d5-2b5c-4c3a-a205-d69e46a609c5','2026-07-15','2026-07-15 16:05:46.000','2026-07-16 00:56:56.000','PRESENT',0,31870,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:36.346','2026-07-25 07:26:36.346'),('a31e6da3-ae51-4ae8-b5ea-bfd1fb51b234','2026-07-16','2026-07-16 16:06:00.000','2026-07-17 00:52:37.000','PRESENT',0,31597,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:36.596','2026-07-25 07:26:36.596'),('a9d49c84-84f9-41f1-b2a3-8f6ab03c63f8','2026-07-21','2026-07-21 16:06:55.000','2026-07-22 00:35:43.000','PRESENT',0,30528,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:37.810','2026-07-25 07:26:37.810'),('a9ea9dc4-f648-48f0-afee-a611b7fc1eea','2026-06-29','2026-06-29 16:05:32.000','2026-06-30 00:42:08.000','PRESENT',0,30996,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:30.811','2026-07-25 07:26:30.811'),('ab78ddd7-8f9b-47ee-9f4c-de80ca3f9253','2026-07-02','2026-07-02 16:02:33.000','2026-07-03 00:57:41.000','PRESENT',0,32108,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:32.408','2026-07-25 07:26:32.408'),('abcc496b-7677-4083-abda-e6fa73669848','2026-07-22','2026-07-22 16:07:00.000','2026-07-23 00:31:28.000','PRESENT',0,30268,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:38.360','2026-07-25 07:26:38.360'),('ac017070-3c03-44b6-a800-6526891ba507','2026-07-15','2026-07-15 16:10:55.000','2026-07-16 00:42:45.000','PRESENT',0,30710,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:35.938','2026-07-25 07:26:35.938'),('b2b2c604-0bb8-44d2-bc97-02548bd6ef0f','2026-07-17','2026-07-17 16:00:45.000','2026-07-18 00:48:56.000','PRESENT',0,31691,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:36.991','2026-07-25 07:26:36.991'),('b674fa76-eecb-4db9-aabe-fa10a75f11a4','2026-07-16','2026-07-16 16:13:25.000','2026-07-17 00:52:22.000','PRESENT',1,31137,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:36.401','2026-07-25 07:26:36.401'),('bc668f03-40c6-47d2-b745-2a1bb1b48a45','2026-07-17','2026-07-17 16:13:56.000','2026-07-18 00:44:14.000','PRESENT',1,30618,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:37.116','2026-07-25 07:26:37.116'),('c17fbe50-0275-431f-952d-a006972cf39e','2026-07-03','2026-07-03 16:05:12.000','2026-07-04 00:44:18.000','PRESENT',0,31146,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:32.830','2026-07-25 07:26:32.830'),('c383a3ad-b116-4854-9526-adb49a847819','2026-07-06','2026-07-06 16:13:22.000','2026-07-07 00:53:31.000','PRESENT',1,31209,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:33.204','2026-07-25 07:26:33.204'),('c4d0d988-6647-497a-bda5-0f3710d719d0','2026-07-14','2026-07-14 16:02:53.000','2026-07-15 00:43:00.000','PRESENT',0,31207,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:35.740','2026-07-25 07:26:35.740'),('c9542e9f-98f5-478b-97db-ab1f7f548380','2026-07-06','2026-07-06 16:14:41.000','2026-07-07 00:52:50.000','PRESENT',1,31089,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:33.070','2026-07-25 07:26:33.070'),('cc89edff-a505-48bb-9e99-b24bdb3e8b10','2026-07-11','2026-07-11 16:05:42.000','2026-07-12 00:33:11.000','PRESENT',0,30449,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:34.901','2026-07-25 07:26:34.901'),('ccd00f2f-d114-49c8-9d73-3f51a74d6049','2026-07-03','2026-07-03 16:01:25.000','2026-07-04 00:38:58.000','PRESENT',0,31053,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:32.593','2026-07-25 07:26:32.593'),('d1adcfb1-3751-4eaf-b431-034d545c6e42','2026-07-07','2026-07-07 16:06:40.000','2026-07-08 00:52:17.000','PRESENT',0,31537,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:33.446','2026-07-25 07:26:33.446'),('d3a931eb-42ac-4ae9-b7d8-93c834700379','2026-07-20','2026-07-20 16:09:26.000','2026-07-21 00:57:10.000','PRESENT',0,31664,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:37.410','2026-07-25 07:26:37.410'),('d83b2398-b101-4f30-ad3d-d0f95172f7f7','2026-07-08','2026-07-08 16:10:45.000','2026-07-09 00:38:45.000','PRESENT',0,30480,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:33.830','2026-07-25 07:26:33.830'),('de5e143c-9721-4950-83e9-77bf29805247','2026-07-19','2026-07-19 16:07:14.000','2026-07-20 00:51:46.000','PRESENT',0,31472,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:37.317','2026-07-25 07:26:37.317'),('df8665af-37a9-4f6c-bdd8-903d4b8427dd','2026-07-03','2026-07-03 16:03:25.000','2026-07-04 00:44:55.000','PRESENT',0,31290,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:32.713','2026-07-25 07:26:32.713'),('e35345fe-462c-4892-a031-feaeaf2a9c7f','2026-07-21','2026-07-21 16:11:48.000','2026-07-22 00:38:24.000','PRESENT',1,30396,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:38.084','2026-07-25 07:26:38.084'),('e56aae86-f3a4-47a1-9e98-af963b28445a','2026-07-20','2026-07-20 16:03:46.000','2026-07-21 00:54:17.000','PRESENT',0,31831,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:37.746','2026-07-25 07:26:37.746'),('e5a63d68-f0c6-434d-a34e-0a425c42bfc8','2026-07-09','2026-07-09 16:11:17.000','2026-07-10 00:52:30.000','PRESENT',1,31273,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:34.179','2026-07-25 07:26:34.179'),('e7678374-c88d-4a19-a2c3-783b991c82e5','2026-07-08','2026-07-08 16:11:31.000','2026-07-09 00:46:33.000','PRESENT',1,30902,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:34.015','2026-07-25 07:26:34.015'),('e82458c3-2997-4957-90ed-3f9228bd6cbd','2026-07-10','2026-07-10 16:14:23.000','2026-07-11 00:51:06.000','PRESENT',1,31003,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:34.657','2026-07-25 07:26:34.657'),('e8d98cea-7894-45fb-8bb2-d072e21c84e3','2026-07-16','2026-07-16 16:13:30.000','2026-07-17 00:33:45.000','PRESENT',1,30015,'48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:36.460','2026-07-25 07:26:36.460'),('e9a12683-9900-4617-b4d7-9efd21568dcf','2026-07-07','2026-07-07 16:05:47.000','2026-07-08 00:45:32.000','PRESENT',0,31185,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:33.634','2026-07-25 07:26:33.634'),('eeb04c37-330e-4d5b-9e57-228c28de38aa','2026-07-01','2026-07-01 16:07:10.000','2026-07-02 00:46:55.000','PRESENT',0,31185,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:31.969','2026-07-25 07:26:31.969'),('f16b5ba7-4961-4ef0-bc12-e474f93deec7','2026-06-26','2026-06-26 16:12:08.000','2026-06-27 00:48:23.000','PRESENT',1,30975,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:30.026','2026-07-25 07:26:30.026'),('f179d020-423f-45fb-9bfd-e84db1303a80','2026-07-10','2026-07-10 16:08:37.000','2026-07-11 00:52:54.000','PRESENT',0,31457,'c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:34.717','2026-07-25 07:26:34.717'),('f57b8636-0e36-498d-97b6-e09923d31df6','2026-07-02','2026-07-02 16:08:48.000','2026-07-03 00:35:28.000','PRESENT',0,30400,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:32.165','2026-07-25 07:26:32.165'),('f5cf6641-6d66-400c-acfa-40fb6d27caf2','2026-07-10','2026-07-10 16:14:54.000','2026-07-11 00:46:54.000','PRESENT',1,30720,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:34.784','2026-07-25 07:26:34.784'),('f8bfa199-9357-4eef-bd01-0a0a2d9ad7db','2026-07-02','2026-07-02 16:00:12.000','2026-07-03 00:42:28.000','PRESENT',0,31336,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:32.344','2026-07-25 07:26:32.344'),('f986f329-7d79-418c-8c3c-8733f2f2562c','2026-07-20','2026-07-20 16:07:01.000','2026-07-21 00:31:00.000','PRESENT',0,30239,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:37.619','2026-07-25 07:26:37.619'),('fa9ae0e6-5350-40e2-a577-5fc17a1dac34','2026-07-08','2026-07-08 16:00:26.000','2026-07-09 00:32:56.000','PRESENT',0,30750,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:34.122','2026-07-25 07:26:34.122'),('fabd0cde-138c-434b-ad5b-24e336f290ee','2026-07-17','2026-07-17 16:06:45.000','2026-07-18 00:41:52.000','PRESENT',0,30907,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:36.794','2026-07-25 07:26:36.794'),('fbabb013-201b-4ae2-974b-918a2345bc7f','2026-07-09','2026-07-09 16:07:32.000','2026-07-10 00:46:51.000','PRESENT',0,31159,'b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:34.357','2026-07-25 07:26:34.357'),('fc6174b2-6455-4ffb-a9a7-4b319910894b','2026-07-03','2026-07-03 16:12:11.000','2026-07-04 00:44:33.000','PRESENT',1,30742,'163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:32.531','2026-07-25 07:26:32.531'),('fe705bcc-9cb3-42f7-9a28-bf14152c1d1d','2026-07-24','2026-07-24 16:06:43.000','2026-07-25 00:56:26.000','PRESENT',0,31783,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:39.011','2026-07-25 07:26:39.011'),('ff0be296-bd9c-4aa2-86b7-dcb6f9be9466','2026-07-11','2026-07-11 16:13:33.000','2026-07-12 00:57:15.000','PRESENT',1,31422,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:34.964','2026-07-25 07:26:34.964'),('fffa2be2-44fd-4a09-8a99-f45103c0057b','2026-06-28','2026-06-28 16:05:52.000','2026-06-29 00:50:24.000','PRESENT',0,31472,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:30.750','2026-07-25 07:26:30.750');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_organizationId_fkey` (`organizationId`),
  KEY `audit_logs_userId_fkey` (`userId`),
  CONSTRAINT `audit_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('00310bad-7d01-4568-9fc4-3f5411026edd','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-18 07:25:05.063'),('05f950c9-1846-4d90-973a-36b2dc58a430','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 06:57:58.673'),('0758980f-2b63-4dbd-ba73-78def7b92a56','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 11:11:22.584'),('07aa8e44-894e-425e-93cd-ef9c3c0244fe','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-17 12:58:53.341'),('08cbdd04-15a3-454e-9c66-6d8cb030ef2f','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 06:42:22.253'),('09b06845-3d18-4270-8ba7-4cc20491a785','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 07:16:41.656'),('0aa06515-5b72-45d1-9470-0f8f4aedce01','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 10:45:18.136'),('0ae702e0-d4f3-442f-af25-890ca8eaef24','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 10:41:48.717'),('0bdf7008-3222-4238-aadd-78cf6003d669','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-04 13:37:51.929'),('0c3df417-0836-4363-ad31-a8b0bee2d1b7','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-16 12:13:03.087'),('0c7ea4e8-4cca-43cc-9e29-5d2d513ee4b7','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 10:18:34.363'),('0ffead80-bea4-4e06-aa54-c9cc295d62d1','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-17 13:28:08.609'),('105730c8-5e51-4311-9e6a-460bfbf1f261','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-02 05:23:01.600'),('133b1899-6d35-4a26-ade6-c32ca373bead','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-01 11:05:43.764'),('135a6bb8-f224-46a7-a74b-af33dbf1c16a','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-02 06:51:41.953'),('15ad6350-e7e9-41ed-9123-e48679bcad84','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-16 09:19:15.682'),('174dd297-ff8a-4305-a7ca-d071f3a4205f','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-27 06:05:09.811'),('1a660df2-efa3-4075-9b45-4669d821ac2d','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-17 12:25:59.605'),('1c4b1b8b-7bf5-4726-afae-b36a03c629c5','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 07:15:21.088'),('1caf46b6-3a56-4da5-9dd8-fc15641394ff','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 09:17:29.190'),('1d88c4f4-d6c7-48b2-9ed6-40491a489a38','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-01 11:04:24.377'),('1f62adc6-1553-4efd-8655-e91d9051117b','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 07:10:52.748'),('1fe5b09d-bc2b-47f7-a685-48e17361d079','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 10:46:27.872'),('2053a3de-fcad-4df0-b97d-e8ce07e15331','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 09:59:30.648'),('21af33d3-47fb-4e9b-8ef6-d6df58b22dbd','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-16 12:35:49.910'),('22ca9763-6929-497d-8db4-839100d28597','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 12:47:02.355'),('25407a25-1e80-4953-925d-3cc33a8f55e0','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 10:45:34.925'),('277ae98c-a1fd-4bf5-8a80-fbbf2ae3dad1','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Denied',NULL,'{\"reason\":\"Invalid password\"}','2026-11-18 05:32:30.109'),('28c4ce9e-7082-4558-83fa-3bc096c79922','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 01:20:51.453'),('299f5b23-968a-451e-b2fb-a42153fff833','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-26 12:09:54.946'),('2a9f959b-bd12-4997-b5e2-6427ec7deb81','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-01 11:20:15.545'),('2bc06600-fdc5-4b0b-be29-d2a09f6a7d37','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-18 05:46:44.357'),('2ce1da75-bac8-4090-b852-c8a8afcd73dd','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-18 06:02:18.777'),('2f2f59e9-ed63-4bdd-8130-8a8d33fb3679','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 05:45:59.471'),('32fa7c08-8b78-4140-b956-8b70ec039ad0','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-05-23 11:11:52.647'),('3305a8e3-8c57-4621-95ca-3b5e8f567f85','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 12:39:07.648'),('34ed36f8-2947-47c0-9212-81c882c33a19','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 07:38:37.746'),('36507d15-36bc-4719-bc28-7334637d6f78','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-07 08:44:01.062'),('3bbafce7-bccd-49ef-97cf-0a36f6a65d6d','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 07:10:53.170'),('3da80cb4-20e3-4e25-a643-bb31cfe933dc','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-02 07:32:12.734'),('3dfd7f7b-a21a-44d5-9ce6-4c4bbd4b427b','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 06:01:40.922'),('3eb1aea4-e88f-464c-a7b1-dbec2e634019','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 03:49:17.607'),('40dc7742-a41f-421f-a6d5-89e3084b37d7','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-26 12:46:36.626'),('427cee19-44fa-47cf-86d7-a57baeb64cac','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 05:59:51.640'),('433bff68-2b4b-402e-9a23-d34bd4cdd6d8','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-16 12:36:53.591'),('43b9bd99-b814-4002-8ab1-06281195e468','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-16 09:19:05.498'),('4615a85c-8d47-4601-b864-7be1d2791993','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 10:36:28.045'),('484eb006-733e-46d6-a58b-8f4047d9a533','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','Updated Monitoring Policy','Success','::1','{\"id\":\"0fbd645f-7878-4dc2-97f0-da24737a3c69\",\"organizationId\":\"default-org-id\",\"gdprEnabled\":true,\"activityMonitoring\":false,\"locationTracking\":true,\"showUrlsInActivityLogs\":false,\"blurLevel\":2,\"saveOriginalScreenshots\":false,\"collectPHI\":null,\"twoFactorEnabled\":false,\"encryptionEnabled\":false,\"consentPercentage\":0,\"retentionPeriod\":30,\"createdAt\":\"2026-04-06T10:16:00.697Z\",\"updatedAt\":\"2026-04-06T10:16:00.697Z\"}','2026-05-23 07:16:07.731'),('4a43f1dc-8eae-4497-9060-731b61dcd57e','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-07-25 07:31:09.792'),('4bfa6939-4ef0-435e-a231-b115dc6d2266','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 09:18:01.221'),('4e74d212-1b87-4687-a489-9d962ed96091','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 01:09:26.827'),('4f9f0169-367a-4c7f-821e-e4b75912d109','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-18 07:36:59.738'),('509bd4d1-5616-4b82-a2b9-a10ddafd2e2b','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-23 12:42:35.009'),('50c184ac-9b89-4d86-b09e-b450137de03c','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-26 13:47:46.850'),('51e3d428-dbca-41a1-8db8-28c7dae9a41c','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 05:51:22.451'),('530f7baf-47d3-46e4-9e42-e115e1783405','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 06:37:48.302'),('533e30ff-43a2-42a9-b578-b5dc7b912b91','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-02 07:16:45.940'),('535632bd-5ec1-4b0e-885e-f940ef47781a','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 11:28:19.792'),('53a33686-77f3-4395-b5a1-8984e2da1cdc','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 09:26:49.191'),('547e12c4-6b0a-4e5a-a5ef-d00b5f6eb4fe','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-27 05:53:58.881'),('54e8ebfd-001b-4323-b118-f83f7dc8b5ae','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-04-06 10:40:04.639'),('559c7308-fd84-474d-815e-4c2d3e122610','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-23 14:08:34.262'),('57fe40b1-f499-422c-9e9f-3752ad0b2dc6','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-16 11:52:52.461'),('5ce4390a-b3f3-4517-a73d-21c2f9e949ba','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 09:17:34.813'),('5d28956b-2879-45cb-8549-ab4c7f5457e2','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 10:45:41.726'),('5de438b5-599a-4e09-86e9-253de916b592','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 09:47:59.435'),('5e4c06cf-97e0-44f7-b631-2ef6115b9f73','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-18 07:22:08.267'),('5e53173a-3a00-47a1-b638-e2de630b7bdb','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 11:04:49.579'),('5ff1c404-08bf-4b5c-9598-427e735b352f','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-16 11:19:13.838'),('611698a8-35a0-4fdd-a557-871f1c8922d4','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-01 10:19:54.308'),('611e8fbe-2c6e-4ae2-b788-52d1329657dd','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-17 12:59:04.341'),('630f7884-38db-4296-bea3-b2424fe8cea5','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 10:38:32.489'),('65656ff2-6fce-4235-b90a-56e99280c920','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 09:17:45.726'),('69c56db7-fa6a-48e6-a672-7585c144aa9e','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-04-06 12:46:46.239'),('6a082ba7-a9d2-485c-b7f5-0371a461e0d1','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-07 07:33:46.880'),('6f4b2615-bf24-4fc9-848e-cdd8a8219bf3','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 07:40:51.028'),('6f7bd481-1f5c-4f0d-932b-2a62821c45ef','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 12:05:32.508'),('70d00bd2-69b0-47ca-aee2-195f9f347727','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 01:17:53.954'),('71a2a945-71c7-450e-a282-0385c29ed070','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-18 07:15:53.218'),('734b76df-a5a5-42e8-be67-9e7e148a0568','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 11:10:05.928'),('743ca406-c91c-4aa7-a08a-fe75a66121e6','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-01 11:30:47.364'),('752a6afb-09f6-4bb3-b8d9-285ab3fcac26','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-04-04 13:39:51.898'),('75b1fd64-a1ba-48b1-8c8a-4b0251ba34e1','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-18 07:18:31.490'),('761acbb8-eb01-4af1-8181-632dbf39839c','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-16 06:19:49.020'),('76d67f2d-4a7e-4a16-9530-734ba1d6ac41','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 06:39:30.689'),('7a31aa83-dfd4-4d21-bab8-4bdeb5dff702','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-07-24 14:28:27.125'),('7acb4f65-4efc-41ac-9cba-d8d1e0728d54','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-04-06 10:45:21.905'),('7be4426c-b5af-423b-9ddb-c3afdf4cd33e','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-18 07:16:41.568'),('7be8047e-5425-43d4-94ed-3fff19fa789c','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-16 06:04:11.327'),('7c28b194-f6b8-4116-be01-b43cbfd25d22','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-01 10:28:45.247'),('7d41a169-6c24-4ca9-b70e-94963632ddaa','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-05-23 12:04:43.842'),('7df120b6-5324-4e1c-bdc8-f39384ecd829','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-16 06:10:17.756'),('81574864-35e2-4244-b5e7-6f52212f4387','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-04-04 13:39:59.952'),('81aaf99d-fd1c-439f-af39-d810e446828d','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-17 13:17:26.678'),('83f045a3-0ae2-4750-92db-7ea1a7b2e6b1','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-27 06:17:26.376'),('852ccf58-16d3-443b-8a27-dc8c99644329','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 11:47:06.892'),('8651be71-03f6-4651-afcf-4f5fcdb06c60','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','Updated Monitoring Policy','Success','::1','{\"id\":\"0fbd645f-7878-4dc2-97f0-da24737a3c69\",\"organizationId\":\"default-org-id\",\"gdprEnabled\":true,\"activityMonitoring\":false,\"locationTracking\":true,\"showUrlsInActivityLogs\":false,\"blurLevel\":2,\"saveOriginalScreenshots\":false,\"collectPHI\":null,\"twoFactorEnabled\":false,\"encryptionEnabled\":false,\"consentPercentage\":0,\"retentionPeriod\":30,\"createdAt\":\"2026-04-06T10:16:00.697Z\",\"updatedAt\":\"2026-04-06T10:16:00.697Z\"}','2026-05-23 07:16:09.732'),('866694bb-1756-4470-8500-5023eed5212e','b27957c7-9430-450b-ab74-9f86dbdaec02','656bfb4e-4f15-4da2-bc93-16d57b5b2093','User Login','Success',NULL,'{}','2026-11-18 07:19:26.435'),('877d1962-96eb-4539-bf02-042eafacf084','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 11:14:33.926'),('8930df88-de26-4c29-af68-5408fbc16c9f','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-18 05:03:47.570'),('8a48a022-22ac-4367-a9cb-5f5dbca72e2a','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 06:57:41.224'),('8d7e825b-28b2-4a7d-ad92-2bfa491ed648','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-16 12:14:50.646'),('8e9e6189-703e-46fe-9fc2-d2008aedda8f','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-18 07:19:26.716'),('8ee5d41f-9590-480c-bada-ae993d1f20ee','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 10:39:41.431'),('8f0fb617-01fd-435b-893b-7e75e853db4d','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-18 07:22:45.708'),('92f50f9b-06e6-4834-8e8f-88bc4b2e0e4b','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-07-24 10:36:54.399'),('937befb3-b947-4272-a85a-6b5e7fac9a6c','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-04-06 10:38:07.719'),('943fd634-37ad-426a-be08-5fb303b162ed','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 11:08:47.770'),('969cfafe-cf2e-4d57-94fd-85e7828cbfa5','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 13:39:00.818'),('973c9f53-cdaa-4d44-9edc-26b36461c20c','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-04-06 12:39:19.599'),('97e54a7b-ab3e-4e48-a5d6-76b6d6a7ea9f','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 05:48:22.633'),('98481173-60a0-4116-8288-d64f79aa9e41','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','Updated Monitoring Policy','Success','::1','{\"id\":\"0fbd645f-7878-4dc2-97f0-da24737a3c69\",\"organizationId\":\"default-org-id\",\"gdprEnabled\":true,\"activityMonitoring\":true,\"locationTracking\":true,\"showUrlsInActivityLogs\":false,\"blurLevel\":2,\"saveOriginalScreenshots\":false,\"collectPHI\":null,\"twoFactorEnabled\":false,\"encryptionEnabled\":false,\"consentPercentage\":0,\"retentionPeriod\":30,\"createdAt\":\"2026-04-06T10:16:00.697Z\",\"updatedAt\":\"2026-05-23T07:16:09.719Z\"}','2026-05-23 07:16:40.821'),('9c1f51f5-71f7-4d7d-ba0b-a1478439cc00','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-27 06:17:17.933'),('9d3a3e5e-f7c6-494c-9044-2b96561f1cfb','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-27 06:11:56.931'),('a2ad9ccd-ace7-4a0d-a2a4-7c14fadc1ef6','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-18 06:46:06.310'),('a5dc07fb-0256-4ab6-92db-932ddb054c88','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 07:38:10.794'),('a685a28d-065f-49c9-b0cf-8d4df4bdd683','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 05:48:29.908'),('a98c5744-2380-4d7b-8d3b-7fd9a6c84569','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 12:39:51.960'),('addbcefd-ff8d-46f1-84be-6f78ac9490ba','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-02 06:09:58.354'),('af0f089d-5781-4aad-b65a-36c4a8176ed5','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 10:59:56.476'),('af683168-038f-4127-89bb-54df39a40cf1','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-18 07:19:26.541'),('afceb5b8-cac3-4f9e-b6a1-ce0c151325b3','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-26 12:54:24.633'),('b04ea9c7-a6ab-4d61-8d7f-9d56b8fcf7d1','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 13:45:30.825'),('b12f706b-1370-405f-af9e-c34797862bcc','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-04-06 12:40:49.271'),('b39ce1a8-7c9d-440d-aa73-4573b0cf0547','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-23 14:13:48.696'),('b434c7ab-9c63-42ec-a2b0-084a92faab4b','b27957c7-9430-450b-ab74-9f86dbdaec02','656bfb4e-4f15-4da2-bc93-16d57b5b2093','User Login','Success',NULL,'{}','2026-11-18 06:58:58.957'),('b45d701e-8260-4ad1-a521-79ed1826c841','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-18 07:22:45.485'),('b73c1632-6c60-4416-849a-2a2a3df40e31','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','Updated Monitoring Policy','Success','::1','{\"id\":\"0fbd645f-7878-4dc2-97f0-da24737a3c69\",\"organizationId\":\"default-org-id\",\"gdprEnabled\":true,\"activityMonitoring\":true,\"locationTracking\":true,\"showUrlsInActivityLogs\":false,\"blurLevel\":2,\"saveOriginalScreenshots\":false,\"collectPHI\":null,\"twoFactorEnabled\":false,\"encryptionEnabled\":false,\"consentPercentage\":0,\"retentionPeriod\":30,\"createdAt\":\"2026-04-06T10:16:00.697Z\",\"updatedAt\":\"2026-04-06T10:16:00.697Z\"}','2026-05-23 07:16:08.909'),('b7e142ec-08e4-455c-8328-6cf8291a7b31','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-27 06:07:51.334'),('b7fbeb7b-97d4-4cad-9460-902263bbfa90','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 12:49:42.022'),('b9546569-1400-4281-9333-32425cff7230','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-18 06:59:12.604'),('b9899d58-c149-40e6-9460-860e54f3b9b5','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-07 07:32:51.450'),('b9ccb184-faa3-4554-80b3-bb7afe97f509','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-04-06 12:39:08.032'),('bb00178b-b2c3-419f-9f22-fad2382de0e3','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 12:28:48.320'),('bda9d30b-a62f-4421-b551-91a263675d58','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 11:19:05.175'),('be00040b-a6f1-4206-b407-d7594811c540','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 07:58:46.002'),('c0871f3b-087a-46c1-9084-dba26d0fd5c2','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 13:21:43.322'),('c11247f2-c518-4a82-b57b-38758730561c','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 01:31:43.347'),('c41723c7-89ee-4445-ad7d-317d7a71d44e','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-18 07:19:26.350'),('c7e14c96-e873-461d-b4f9-ba3f5d12bc7b','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 10:46:50.948'),('c82d42c0-4434-4fdd-9e21-0c9cac0dc151','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 07:19:26.627'),('c8399176-b33d-4126-b929-cf3515da9a58','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Denied',NULL,'{\"reason\":\"Invalid password\"}','2026-11-18 05:32:21.909'),('ca8463b0-5238-47c4-a348-6c9b5e8a0291','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-05-23 11:45:26.760'),('cb60a3ab-25cb-4364-977b-f9716fc71b58','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-04-06 10:40:08.078'),('cbb7e423-7537-464f-8872-a5019b51e0bd','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-17 13:01:31.521'),('cc54fe7f-30ee-443b-85ee-da7b55f48f79','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','User Login','Success',NULL,'{}','2026-11-18 05:12:02.157'),('cd22dac3-88c4-4e39-b0bc-2c95a75a7a72','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 10:45:52.514'),('ce0a96d9-0153-451c-8535-7cbae782e305','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-18 07:21:12.856'),('ce261e61-1ab2-486e-9a53-879e21918c8a','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Denied',NULL,'{\"reason\":\"Invalid password\"}','2026-11-18 05:36:31.630'),('cef33e04-dc67-4bbb-8ffb-932d05e9d086','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 07:33:17.913'),('d146136c-ebb3-4020-80e8-f0a304a8dca4','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 10:42:32.367'),('d35a21d6-b19b-4752-8d38-d7ceb7c7141d','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 11:12:41.883'),('d6cbb97f-5656-4ee6-ba73-f1041ba86d87','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 07:10:08.761'),('d7b78b7d-9de6-412e-93c5-f9ef01203509','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-18 07:16:41.734'),('da50aa4f-dbcf-4ad9-9cc3-f7ed421fc31d','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 07:12:04.625'),('dc08bf73-4a6c-4878-8deb-5c36b6cb4718','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 14:47:49.920'),('dc3fde89-411b-4826-9bf7-a5470011f80d','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-07 06:47:11.449'),('de4ada9a-cc5c-4a04-a39d-fc5ff415f989','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 10:37:20.370'),('e3372c54-b00b-4098-8bed-bec837f95ce9','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 10:45:18.409'),('e53309af-f474-4782-a550-167090bc48a2','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','User Login','Success',NULL,'{}','2026-11-17 07:34:16.300'),('e6a7dc76-170f-4eb1-a860-56bb753d7816','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 03:48:35.773'),('e7229363-795c-47b5-91b4-5f8c4bb4d395','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-06-01 10:32:40.703'),('e91fddbc-fb1a-452e-8f76-337b3e3a549a','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 14:26:24.318'),('ea39912d-1674-4a83-9bb6-2fd57e22c173','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 10:00:07.389'),('ea6bf1c8-0453-4e7a-9ef0-43600c02cacc','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','User Login','Success',NULL,'{}','2026-11-18 07:22:45.589'),('ed578a79-04a7-4357-b285-fcefdfb2eb43','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-23 14:13:22.882'),('f11f2dde-832d-4dde-971f-4453f652b5a8','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-24 09:19:42.122'),('f1b1c5fd-31e7-46d8-86f3-3ff2134d39bf','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-25 08:16:29.139'),('f4390f41-96c6-46e8-a29e-5ccd6d6775f9','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-07-23 14:07:33.699'),('f45954f1-efb5-4c38-9dc7-cf8168279db2','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-11-17 07:07:22.367'),('fd9147d0-eef9-4713-b26a-40512c40f666','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','User Login','Success',NULL,'{}','2026-05-23 13:19:42.797');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compliance_settings`
--

DROP TABLE IF EXISTS `compliance_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compliance_settings` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `gdprEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `activityMonitoring` tinyint(1) NOT NULL DEFAULT 1,
  `locationTracking` tinyint(1) NOT NULL DEFAULT 1,
  `showUrlsInActivityLogs` tinyint(1) NOT NULL DEFAULT 0,
  `blurLevel` int(11) NOT NULL DEFAULT 2,
  `saveOriginalScreenshots` tinyint(1) NOT NULL DEFAULT 0,
  `collectPHI` tinyint(1) DEFAULT NULL,
  `twoFactorEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `encryptionEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `consentPercentage` double NOT NULL DEFAULT 0,
  `retentionPeriod` int(11) NOT NULL DEFAULT 30,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `compliance_settings_organizationId_key` (`organizationId`),
  CONSTRAINT `compliance_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compliance_settings`
--

LOCK TABLES `compliance_settings` WRITE;
/*!40000 ALTER TABLE `compliance_settings` DISABLE KEYS */;
INSERT INTO `compliance_settings` VALUES ('0fbd645f-7878-4dc2-97f0-da24737a3c69','default-org-id',1,1,1,0,2,0,NULL,0,0,0,30,'2026-04-06 10:16:00.697','2026-05-23 07:16:40.811'),('a2d47968-5e84-42c4-91e7-60faab878705','b27957c7-9430-450b-ab74-9f86dbdaec02',1,1,1,0,2,0,NULL,0,0,0,30,'2026-05-27 07:46:45.926','2026-05-27 07:46:45.926');
/*!40000 ALTER TABLE `compliance_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_reports`
--

DROP TABLE IF EXISTS `email_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_reports` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `frequency` varchar(191) NOT NULL,
  `recipients` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`recipients`)),
  `sendToSelf` tinyint(1) NOT NULL DEFAULT 1,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `email_reports_organizationId_fkey` (`organizationId`),
  CONSTRAINT `email_reports_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_reports`
--

LOCK TABLES `email_reports` WRITE;
/*!40000 ALTER TABLE `email_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employees` (
  `id` varchar(191) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `role` enum('ADMIN','MANAGER','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  `location` varchar(191) DEFAULT 'Remote',
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `computerType` enum('COMPANY','PERSONAL') NOT NULL DEFAULT 'COMPANY',
  `status` enum('INVITED','ACTIVE','OFFLINE','IDLE','BREAK','DEACTIVATED','MERGED') NOT NULL DEFAULT 'ACTIVE',
  `hourlyRate` double NOT NULL DEFAULT 0,
  `avatar` text DEFAULT NULL,
  `teamId` varchar(191) DEFAULT NULL,
  `organizationId` varchar(191) NOT NULL,
  `trackingSettingId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `workMode` varchar(191) DEFAULT 'Remote',
  `payRateType` varchar(191) DEFAULT 'HOURLY',
  PRIMARY KEY (`id`),
  UNIQUE KEY `employees_email_key` (`email`),
  KEY `employees_teamId_fkey` (`teamId`),
  KEY `employees_organizationId_fkey` (`organizationId`),
  KEY `employees_trackingSettingId_fkey` (`trackingSettingId`),
  CONSTRAINT `employees_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `employees_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `employees_trackingSettingId_fkey` FOREIGN KEY (`trackingSettingId`) REFERENCES `tracking_settings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES ('163aad68-68d7-4a05-b820-86f9e86710f4','Mike Manager','manager@example.com','MANAGER','Remote',NULL,NULL,'COMPANY','ACTIVE',0,NULL,NULL,'default-org-id',NULL,'2026-04-04 13:37:21.578','2026-11-18 07:38:37.753','Remote','DAILY'),('48285691-ec0c-4c20-bbae-7007670ca096','Jane Admin','admin@example.com','ADMIN','Remote',NULL,NULL,'COMPANY','OFFLINE',0,NULL,NULL,'default-org-id',NULL,'2026-04-04 13:37:21.559','2026-11-18 07:38:35.698','Remote','DAILY'),('656bfb4e-4f15-4da2-bc93-16d57b5b2093','employee1','employee@gmail.com','EMPLOYEE','Remote',NULL,NULL,'PERSONAL','ACTIVE',85,'https://ui-avatars.com/api/?name=employee1&background=random',NULL,'b27957c7-9430-450b-ab74-9f86dbdaec02',NULL,'2026-11-17 13:18:22.582','2026-11-18 07:19:26.440','Office','HOURLY'),('b93a4d90-2454-4694-8edd-dcbb7e408098','Alex Employee','employee@example.com','EMPLOYEE','Remote',NULL,NULL,'COMPANY','OFFLINE',0,NULL,'default-team-id','default-org-id',NULL,'2026-04-04 13:37:21.592','2026-11-18 07:25:03.081','Remote','DAILY'),('c4553f00-3292-4798-8fc6-74737b0c7fa1','admin demo','admin@gmail.com','ADMIN','Remote',NULL,NULL,'COMPANY','ACTIVE',0,NULL,NULL,'b27957c7-9430-450b-ab74-9f86dbdaec02',NULL,'2026-05-27 07:46:31.929','2026-11-18 07:19:26.354','Remote','DAILY'),('dec4a6b8-c082-4ce2-b525-3b7a545317ee','Test','test@example.com','EMPLOYEE','— (Remote) (Remote)',NULL,NULL,'COMPANY','ACTIVE',10000,NULL,'e27d6e38-63d7-478a-b9f5-3eeb09c4e8a6','default-org-id',NULL,'2026-05-22 14:09:34.260','2026-07-23 13:08:10.166','Remote','MONTHLY'),('f91283ce-1bc8-4c4b-95f1-0637b2e997fd','abc kumar','astp750@gmail.com','EMPLOYEE',NULL,NULL,NULL,'PERSONAL','INVITED',0,NULL,'e27d6e38-63d7-478a-b9f5-3eeb09c4e8a6','b27957c7-9430-450b-ab74-9f86dbdaec02',NULL,'2026-11-17 09:50:22.567','2026-11-17 09:50:22.567','Remote','HOURLY');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goal_activities`
--

DROP TABLE IF EXISTS `goal_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goal_activities` (
  `id` varchar(191) NOT NULL,
  `goalId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `activityDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `goal_activities_goalId_fkey` (`goalId`),
  CONSTRAINT `goal_activities_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `goals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goal_activities`
--

LOCK TABLES `goal_activities` WRITE;
/*!40000 ALTER TABLE `goal_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `goal_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goal_stakeholders`
--

DROP TABLE IF EXISTS `goal_stakeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goal_stakeholders` (
  `id` varchar(191) NOT NULL,
  `goalId` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `goal_stakeholders_goalId_employeeId_key` (`goalId`,`employeeId`),
  KEY `goal_stakeholders_employeeId_fkey` (`employeeId`),
  CONSTRAINT `goal_stakeholders_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `goal_stakeholders_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `goals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goal_stakeholders`
--

LOCK TABLES `goal_stakeholders` WRITE;
/*!40000 ALTER TABLE `goal_stakeholders` DISABLE KEYS */;
/*!40000 ALTER TABLE `goal_stakeholders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goals`
--

DROP TABLE IF EXISTS `goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goals` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `sub` varchar(191) NOT NULL,
  `targetDate` varchar(191) NOT NULL,
  `progress` int(11) NOT NULL DEFAULT 0,
  `status` varchar(191) NOT NULL DEFAULT 'ACTIVE',
  `color` varchar(191) DEFAULT 'text-indigo-600 bg-indigo-50',
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `goals_organizationId_fkey` (`organizationId`),
  CONSTRAINT `goals_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goals`
--

LOCK TABLES `goals` WRITE;
/*!40000 ALTER TABLE `goals` DISABLE KEYS */;
INSERT INTO `goals` VALUES ('5357d17d-1556-431f-ad0f-0213e3bc9070','hkjhj','finace','end of 4',0,'ACTIVE','text-indigo-600 bg-indigo-50','default-org-id','2026-05-23 07:56:54.508','2026-05-23 07:56:54.508');
/*!40000 ALTER TABLE `goals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integrations`
--

DROP TABLE IF EXISTS `integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `integrations` (
  `id` varchar(191) NOT NULL,
  `integrationId` varchar(191) NOT NULL,
  `connected` tinyint(1) NOT NULL DEFAULT 0,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `integrations_organizationId_integrationId_key` (`organizationId`,`integrationId`),
  CONSTRAINT `integrations_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integrations`
--

LOCK TABLES `integrations` WRITE;
/*!40000 ALTER TABLE `integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `integrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invitation_tokens`
--

DROP TABLE IF EXISTS `invitation_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invitation_tokens` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitation_tokens_token_key` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invitation_tokens`
--

LOCK TABLES `invitation_tokens` WRITE;
/*!40000 ALTER TABLE `invitation_tokens` DISABLE KEYS */;
INSERT INTO `invitation_tokens` VALUES ('210b3f6e-6697-4f0f-af05-4e331a0c50da','ak@gmail.com','bef49c207e2255f6b85394d9409e8ce8446c40952d1fd14e9a269c9eb4a90361','default-org-id','EMPLOYEE','2026-05-30 13:01:32.628','2026-05-23 13:01:32.629'),('2cdd82c6-fd1b-43b4-a436-51959a985cc8','ashilatasaket.rewa@gmail.com','9dd7c1208a1488819554996b1a7c32ac9b76c796b78da71f037a37dc6ac9f6f0','b27957c7-9430-450b-ab74-9f86dbdaec02','EMPLOYEE','2026-11-24 10:03:42.402','2026-11-17 10:03:42.405'),('310bf465-7d01-4801-842f-63bd9a6ae438','employee@gmail.com','ea926f38bdd853e5757c44ca5bb966f7912f453e641371b74678b7b3dbd5f01c','b27957c7-9430-450b-ab74-9f86dbdaec02','EMPLOYEE','2026-11-24 13:18:22.606','2026-11-17 13:18:22.608'),('4454f89a-8082-4441-835f-33e538f72548','astp750@gmail.com','0dc0e1da16f7ac9234911eb9657f42cef70bc676852ff55a3dc20e3847d03279','b27957c7-9430-450b-ab74-9f86dbdaec02','EMPLOYEE','2026-11-24 09:50:22.600','2026-11-17 09:50:22.601'),('e067b48c-735a-4ba1-8862-8e8eba6a38e6','m@gmail.com','f17de158a521b89a14c5d725b1338a6bc8d4b3035be25153767a87bf04e45a7b','default-org-id','EMPLOYEE','2026-05-30 13:02:42.191','2026-05-23 13:02:42.191'),('eea175fa-fbd1-47f9-99a3-12d900d3de56','satya@gmail.com','21099167d7c209593349c17bd8768bd1f9f96351ef6c1d3869beb85f3924f199','default-org-id','EMPLOYEE','2026-05-30 13:00:44.714','2026-05-23 13:00:44.718');
/*!40000 ALTER TABLE `invitation_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` varchar(191) NOT NULL,
  `invoiceNumber` varchar(191) NOT NULL,
  `clientName` varchar(191) NOT NULL,
  `clientEmail` varchar(191) DEFAULT NULL,
  `amount` double NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'USD',
  `issueDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `dueDate` datetime(3) NOT NULL,
  `status` enum('DRAFT','SENT','PENDING','PAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `notes` text DEFAULT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoiceNumber_key` (`invoiceNumber`),
  KEY `invoices_organizationId_fkey` (`organizationId`),
  CONSTRAINT `invoices_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_activities`
--

DROP TABLE IF EXISTS `live_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_activities` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `activeApp` varchar(191) NOT NULL,
  `activeWindow` varchar(191) NOT NULL,
  `keystrokes` int(11) NOT NULL,
  `mouseClicks` int(11) NOT NULL,
  `idleTime` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `live_activities_employeeId_fkey` (`employeeId`),
  KEY `live_activities_organizationId_fkey` (`organizationId`),
  CONSTRAINT `live_activities_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `live_activities_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_activities`
--

LOCK TABLES `live_activities` WRITE;
/*!40000 ALTER TABLE `live_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_logs`
--

DROP TABLE IF EXISTS `location_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `location_logs` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `accuracy` double DEFAULT NULL,
  `source` varchar(191) NOT NULL DEFAULT 'GPS',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `location_logs_employeeId_fkey` (`employeeId`),
  KEY `location_logs_organizationId_fkey` (`organizationId`),
  CONSTRAINT `location_logs_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `location_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_logs`
--

LOCK TABLES `location_logs` WRITE;
/*!40000 ALTER TABLE `location_logs` DISABLE KEYS */;
INSERT INTO `location_logs` VALUES ('000ee21f-37ab-4f91-b3de-c0734e94fe5c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039987408926,75.82869392068201,129,'Browser','2026-11-16 09:19:16.195'),('009a49e0-6121-4869-92ac-b2e6da3d3f60','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:42:28.518'),('00c28cb4-4b54-46c5-8b60-d3b3a13a0ec7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:43:17.878'),('0194a1ce-da4f-4b88-a0c4-8cb14cd1369e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:21:20.534'),('02477881-acd8-4e33-be78-99b2e55ba886','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69071183441115,75.8288241722921,116,'Browser','2026-11-17 10:45:56.925'),('027715de-e818-4bd6-9f5e-c4ed733bfaf2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:33:02.136'),('03a13c32-d86e-48f6-af97-4b4e3e1a6915','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:20:57.624'),('04db8605-9966-4246-a337-f2483ccd3cb0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040034794854,75.82869873300257,129,'Browser','2026-11-16 13:14:14.333'),('05f502f5-9c98-4f41-90f6-08468bc488c5','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.484'),('0602d712-c76b-4540-9d28-d21f2bde1a5e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903998773809,75.82867746595956,129,'Browser','2026-11-17 05:43:22.527'),('06e13aa3-93aa-4480-98bd-75a1413088a3','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:40:49.672'),('0949e92d-d6ec-4d1c-b103-dc5d14436f13','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039987408926,75.82869392068201,129,'Browser','2026-11-16 09:21:53.113'),('0a3f8db8-a771-4b34-8f0a-4288f6add552','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:36:53.949'),('0a59cff4-2551-49e1-a18e-5bb9044e2df1','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.096'),('0ad03894-8f25-4a67-9571-bac37234cbc0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.661'),('0b0d29aa-342f-46a5-9e14-a6a0e41b8029','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:33:05.973'),('0c43bbc2-c1c6-4174-8b44-639558801f94','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903998773809,75.82867746595956,129,'Browser','2026-11-17 05:48:18.822'),('0c46ca1f-1bfb-4fa2-a88e-d0f86bb9708c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039039534392,75.82869475525035,119,'Browser','2026-11-16 10:10:30.579'),('0da1f03d-a372-4a38-98d9-162c9cd90fcf','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038580782307,75.82870401450184,129,'Browser','2026-11-17 07:39:38.198'),('0e781cba-2e92-43cc-8598-5c0f2d23b901','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,50000,'Browser','2026-05-23 11:11:53.205'),('11bbe516-8c8f-4b33-95bc-a6e1e2360faa','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,50000,'Browser','2026-05-23 12:04:44.703'),('11e06e44-bd4b-454a-ae84-7678c01cf6e8','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:36:53.950'),('11e8f1fb-b529-4269-9f1a-3dbadae63123','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:33:02.012'),('1244253e-1906-4eed-8fd9-b4752d9d691a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:13:17.423'),('12f30610-002e-44bd-9011-d03c2dca60e0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:52:57.354'),('14a1ffe5-55bf-463a-8712-2f2dd01d53d2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.155'),('14b6b86d-c594-4c21-9782-a128172a4c11','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037014939266,75.8286877608048,126,'Browser','2026-11-17 05:39:08.985'),('169c9647-87c1-4320-8a21-9549e2c19990','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.541'),('17f224ae-e5b4-41e0-ad0b-c57751bda088','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:59:33.314'),('19bdb7d6-a803-42e3-99dd-1003fd5fb1ff','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:39:08.511'),('19e8325c-3554-40c6-9562-464730f8666d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040254635451,75.82869342196523,129,'Browser','2026-11-16 13:13:56.061'),('1a72121a-7125-4c7b-9f9c-885cc51475ef','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69035277954706,75.82871181216451,138,'Browser','2026-11-17 07:35:20.794'),('1b2409d9-cdec-45cc-a23b-294066a5b737','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 10:38:08.116'),('1b3c665c-c37b-44ad-90ed-b50616bc2054','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:16:18.481'),('1b74b8b1-244c-4f5d-aa2b-50c4578261b5','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:30:24.622'),('1bff8237-e5cc-47cf-a6fa-00c3ea234e23','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:54:56.173'),('1c3cace1-6b8a-46ea-a749-51f6ff2ec7ba','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.436'),('1cbb8381-de04-4bbb-b44d-3537f5ad49ef','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037014939266,75.8286877608048,126,'Browser','2026-11-17 05:42:58.523'),('1cfa9479-5161-4875-848f-36fd7e4cea04','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69057418232632,75.82878258343439,119,'Browser','2026-11-17 10:45:18.790'),('1d2ad45c-5d8f-446b-a5ea-7c616290a32a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041970893548,75.82869087111051,129,'Browser','2026-11-17 09:26:40.225'),('1d8607d5-501f-4322-ab3e-ec6a4743ed52','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69057418232632,75.82878258343439,119,'Browser','2026-11-17 10:45:18.790'),('1e45e626-7d92-4248-8fb3-1f2800a89705','c4553f00-3292-4798-8fc6-74737b0c7fa1','b27957c7-9430-450b-ab74-9f86dbdaec02',22.69065686992218,75.82880113486705,115,'Browser','2026-11-18 06:59:15.425'),('2065ca7a-6eef-4571-b18e-fb241ee78bfc','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036441040642,75.82868721567772,129,'Browser','2026-11-16 10:11:28.910'),('20d7c53b-ca61-4f9d-bfba-de06097524fb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036752606578,75.82870317755803,129,'Browser','2026-11-17 06:57:59.302'),('2108c472-df85-4c20-b569-5219acead1f9','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:19:41.594'),('21426ef3-4775-4dae-857d-8451e02db302','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:47:17.698'),('223c8a8c-834f-4fb5-bbf5-688c5163d9e4','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041970893548,75.82869087111051,129,'Browser','2026-11-17 09:26:40.224'),('225633fb-91e2-4721-807a-b791ee01ec13','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.126'),('22f6bb1a-2e3c-4daa-b426-46bc419f50c0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041970893548,75.82869087111051,129,'Browser','2026-11-17 09:26:40.280'),('22f8eec3-7da6-45c2-87c3-fc34c4c9244c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.350'),('2447a1e0-828a-467c-983f-5ff346213371','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042867323267,75.82871482170836,129,'Browser','2026-11-17 05:38:14.647'),('24e99f1a-521f-40a0-9193-e7b4687087d7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:19:41.590'),('252b266a-9ae8-40c4-887b-46bbf626051e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042867323267,75.82871482170836,129,'Browser','2026-11-17 05:38:14.647'),('252bbfd1-129f-4b7a-af40-61ddc9be29eb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903998773809,75.82867746595956,129,'Browser','2026-11-17 05:48:18.822'),('282e0aa8-663f-4246-9644-5b6f9cafcc37','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:20:54.571'),('28915c57-16b3-4ca8-a54a-1a0e3427140d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:21:20.592'),('28df11aa-7191-4954-9bb2-0cedac508d76','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:39:45.799'),('2a55c2d2-9e22-4360-9efc-7e0c6691e3cb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.209'),('2abbac66-9cf1-4403-a4d9-9192e4dd0738','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038580782307,75.82870401450184,129,'Browser','2026-11-17 07:39:38.199'),('2ae9f19e-983f-49f7-beef-9f1b56d69c27','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:35:17.838'),('2af8dd07-4be0-463e-8984-9dfaa1e39496','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.099'),('2b3c878c-9331-4cd3-9270-abdf743965fc','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 10:45:22.347'),('2b84c350-0530-476a-b964-00284933349c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 10:59:56.876'),('2bc63b3d-0c5a-41e3-8ef3-f6cb503e00ae','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:21:20.548'),('2be16a7e-92c2-433d-a3fd-b010792af218','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 10:59:56.876'),('2c107627-42f7-4d95-87c2-1f1c924a2704','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.099'),('2ef92d5b-b31a-475c-b84d-fea14e6ed69d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040066123424,75.82869374597722,122,'Browser','2026-11-17 04:54:09.590'),('2f3c4a8a-392f-4b1e-b100-ee748510bc45','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:00:14.292'),('2fdf3ba7-089f-4622-8265-c9d9cef81a7a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.489'),('3047ce6b-b932-4a01-9c61-ff9bb94ded65','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036988198127,75.82861344382664,121,'Browser','2026-11-16 13:19:37.742'),('3076a7b4-d7ae-4664-a009-1fcaa72fa28e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.770'),('322a475e-3a81-4e34-b8b2-be2207a53527','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.484'),('32cfa9ef-ccc2-49cd-8814-6b819b6fa340','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:39:33.413'),('3331ae1d-a68d-4c1c-b18d-c80f671a13e6','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69058991915069,75.82877916240675,119,'Browser','2026-11-17 12:24:32.959'),('337dad94-712a-45b0-b365-62a39cbef91f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:22:14.339'),('33bb8ff6-5e37-493f-9a84-f517696cb787','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:12:06.459'),('3ad509f1-da49-4bcb-83e6-804f849977fa','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.351'),('3b3c7b9e-7263-47a9-ad6a-149a65b8b812','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.543'),('3b610ef8-d2a0-4db1-9d67-65f6473b7660','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040724257079,75.82868621160743,120,'Browser','2026-11-18 05:03:52.091'),('3c087115-3955-4518-bf93-bad10812af38','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:54:56.173'),('3d088da6-44a5-4d07-b9d1-14c090a2de95','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040490984037,75.82869351754455,129,'Browser','2026-11-17 06:00:58.920'),('3d22924c-af3f-46aa-839a-1c21a0f12c52','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.352'),('3d72494b-5bad-409a-98cb-05b8034adb26','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69058991915069,75.82877916240675,119,'Browser','2026-11-17 12:25:52.885'),('3f5fe59d-3dc0-46ef-8bbf-55d74a61dce6','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.598'),('3f80a713-088d-4557-bf9b-9531276c3425','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.815'),('4065e3ab-8897-4604-8aa3-36fc9e30dbdb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041795414045,75.82877399829877,155,'Browser','2026-11-17 09:59:30.988'),('40c6c9db-c64d-438d-9cb4-e7cad37a3fad','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:20:54.570'),('410cc6e5-73f0-450d-824e-2cc8ff786e23','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69057009047464,75.82878551418727,119,'Browser','2026-11-18 05:12:00.078'),('42dc5cb7-2a1c-4449-b65a-f2300e83abd4','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:22:52.044'),('43d7c337-910d-496c-80ba-d5f54e62adb3','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041970893548,75.82869087111051,129,'Browser','2026-11-17 09:26:40.275'),('444ad490-02c2-47f8-a39a-44e68b8e5a43','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036988198127,75.82861344382664,121,'Browser','2026-11-16 13:19:37.779'),('4695d2a1-8d5c-425c-9c21-6505d6502480','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037512024896,75.82870277844741,126,'Browser','2026-11-18 07:24:55.520'),('47b6626e-87bb-4fcd-8395-aa4fbefe707c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.701,75.8659,5000,'Browser','2026-04-04 13:40:00.491'),('47c4c745-5e0b-46e1-bdb9-f00783841a35','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:48:20.334'),('47cf4590-8f4c-4ec8-84aa-35e1b28554da','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.489'),('49635832-58fc-4013-aee9-1564fa807ea8','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,50000,'Browser','2026-05-23 12:04:44.703'),('4bf525a8-cce5-4546-a04a-ccd89e159819','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:13:18.385'),('4c58b5bf-3804-4aa3-abbb-6f9e67911c7e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:14:51.057'),('4c7d367e-5616-4db3-8d2c-4383fc888cdb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.209'),('4dbb96b8-f633-4945-a269-e016f00a10eb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:46:17.569'),('4ebc7385-82a1-44d8-bb23-f5aedf4a5d78','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039265326727,75.82869377322821,119,'Browser','2026-11-17 06:38:48.738'),('4f8bf97a-a390-49cb-a4ac-db3387db8942','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:39:08.512'),('516d9b40-87e9-4887-867f-a4f143a93599','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:43:17.880'),('5194211a-2b82-49d5-965d-e8d76c10c645','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69035491929068,75.82871868350284,132,'Browser','2026-11-18 05:04:51.967'),('51c0cc4f-d00c-4284-a9be-781fe9e7d993','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69047380985332,75.82870787096405,135,'Browser','2026-11-17 09:17:35.155'),('51c84efb-1316-4772-bcde-ae198f2bd3e6','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903998773809,75.82867746595956,129,'Browser','2026-11-17 05:59:51.956'),('531ad65e-e59e-44a4-91e9-b7d85dcd1a8b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040724257079,75.82868621160743,120,'Browser','2026-11-18 05:03:52.091'),('53728585-7ae6-42ac-9ea9-3a0c23ad9041','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036988198127,75.82861344382664,121,'Browser','2026-11-16 13:19:37.760'),('542d74af-3e02-48db-b2be-ed6659f9d7a6','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.780'),('542e379f-96dc-4ecc-9303-274832eb0edb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038587951414,75.8287040826938,139,'Browser','2026-11-16 11:04:41.462'),('551d9c22-2a53-4097-872b-5efb57a35e2f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042277577533,75.82869035821106,138,'Browser','2026-11-17 09:18:05.614'),('55575c08-e42e-477a-bc2d-6245fead412d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.446'),('557f2431-12a3-445c-b577-edb683e0102d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:10:18.442'),('567d0149-abd1-4b91-9046-1b2c8616eb83','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:09:06.254'),('56cb74fc-8816-4857-8f40-3ef7f58f7223','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:20:54.571'),('581eec5b-bba4-4b79-8b98-ee06295b3e13','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:39:33.411'),('584e20e4-e600-4a4c-aa19-79e4268dc135','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:14:51.043'),('5858d9de-8f44-463a-8eb0-b2090fddc6e2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:52:57.354'),('59090ca1-781b-4c20-8b57-ca814b7e04b2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 10:45:22.346'),('5a3a32a0-2251-4388-aebb-bde3454a6a29','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:09:06.254'),('5a49c8b0-00d2-403f-b5d4-952c696ffa2d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.701,75.8659,5000,'Browser','2026-04-04 13:40:00.490'),('5b0a38bd-d3c2-4b98-8244-9472b1dc210c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040254635451,75.82869342196523,129,'Browser','2026-11-16 13:14:05.118'),('5b914a24-91c1-410d-bf7c-c0f06b479431','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:39:53.804'),('5c3ac779-e175-4cb1-90e1-ff0af33704e4','c4553f00-3292-4798-8fc6-74737b0c7fa1','b27957c7-9430-450b-ab74-9f86dbdaec02',22.69065686992218,75.82880113486705,115,'Browser','2026-11-18 06:59:15.425'),('5c958fa1-e436-4e07-b02a-00f9f86a79aa','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:22:52.038'),('609bc98d-2e8d-44ba-9031-f6b5e51c96ec','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037512024896,75.82870277844741,126,'Browser','2026-11-18 07:24:55.519'),('60f7a6b9-5207-4307-ae9b-9108e6e1deea','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:10:56.698'),('60fd417d-057b-42a0-81d7-218d0bb0dd89','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69067245502778,75.82883140704635,124,'Browser','2026-11-18 05:11:21.671'),('612434a0-332e-4e0d-9b5a-ffe0f42125cd','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:46:46.924'),('61e062cc-d082-4ae0-abef-1ce40adc0eb2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:45:18.291'),('62cf048e-f0b5-452b-9f71-5e9f5f37c6ae','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042187391566,75.828690511429,126,'Browser','2026-11-17 12:19:48.149'),('630d7d27-0db9-43d8-9763-15015d9aaa86','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:01:03.343'),('6312ef2a-1d83-4323-ad74-5645a8a9d9aa','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037014939266,75.8286877608048,126,'Browser','2026-11-17 05:42:58.525'),('64c74cd3-f389-4ea1-9df3-92577f81ab7f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039265326727,75.82869377322821,119,'Browser','2026-11-17 06:37:53.908'),('651a90c1-ff8c-40ed-8aa7-bcef50ccc712','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040034794854,75.82869873300257,129,'Browser','2026-11-16 13:14:14.334'),('66468e4d-f00f-49e1-9a45-a53dd526bc4a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:02:10.979'),('6752cf2f-6ee1-481f-90db-e15c2ac4b805','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69058991915069,75.82877916240675,119,'Browser','2026-11-17 12:21:24.980'),('679ca2db-ed40-4b8a-9750-1d416af194aa','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.770'),('682e3a72-cbdc-4dea-9196-c02234f3e537','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69067245502778,75.82883140704635,124,'Browser','2026-11-18 05:11:28.723'),('69e2fa5c-bd1e-4fd4-aba0-a26f37801f27','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:19:41.613'),('6a00152c-72fc-4022-ac89-64fb41f7897f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039317672386,75.82869369040255,119,'Browser','2026-11-16 10:10:10.732'),('6a352033-c8ac-4036-99cf-e2cb76b089e4','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038587951414,75.8287040826938,139,'Browser','2026-11-16 11:02:35.947'),('6acefca6-9eab-4e47-a31f-e154c5807360','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.178'),('6b0569ed-2a76-418e-bc94-b0e1a43d0f90','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039395597981,75.82869369040253,119,'Browser','2026-11-17 05:33:22.587'),('6baa7a5f-df84-4463-988f-b15d0d8baf6b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.425'),('6c37a2e2-48fe-4943-92dd-087b1dce9c10','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.495'),('6cb7020f-ab71-4147-bd38-7684a5544aaf','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:16:17.561'),('6cc16cbc-fd75-4c2a-adfb-d10ffcd456e6','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:57:25.127'),('6cd344a0-1810-42db-8295-1204ecf5ec7d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.485'),('6ee54cc8-76c4-466c-84e0-cd82f35f7644','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.155'),('6f10c2a5-bd4d-420e-8df2-347b41b33766','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:59:33.313'),('6f22c141-e5bc-48c2-8e67-826ffe7f122c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040066123424,75.82869374597722,122,'Browser','2026-11-17 05:07:20.656'),('6fd86341-d119-466e-ac68-4b26eca13d5a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038035720835,75.82870906261152,142,'Browser','2026-11-17 07:34:16.771'),('71d1cae7-07dc-4027-abbf-96ada7229637','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:44:18.942'),('7226e149-e8aa-4ee7-82dc-bb3e2c74811a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041970893548,75.82869087111051,129,'Browser','2026-11-17 09:26:40.224'),('724d20b8-30f8-4146-9639-3392b11085b4','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:14:18.382'),('72956dc5-7c6c-4904-8cf8-0b2c58b33ef0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042277577533,75.82869035821106,138,'Browser','2026-11-17 09:18:05.614'),('731b60c4-1154-45da-b283-77c4ba3c2215','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69058991915069,75.82877916240675,119,'Browser','2026-11-17 12:25:52.886'),('73e0991c-b09f-4a6d-bc58-4d3c41ac2919','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:33:02.227'),('7510cba3-0b9e-4f7f-bb96-cd1aa2738d49','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.544'),('75175d81-8901-4a18-a454-2efe0e241989','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042187391566,75.828690511429,126,'Browser','2026-11-17 12:20:31.420'),('75e9c84e-73b1-4fef-a484-38cf7f7c915b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040254635451,75.82869342196523,129,'Browser','2026-11-16 13:13:56.126'),('763c48db-f6dc-42ec-bddd-24e2e95a45d7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040254635451,75.82869342196523,129,'Browser','2026-11-16 13:13:56.082'),('775a48ce-98d2-46e2-a336-09a6e754790f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69058991915069,75.82877916240675,119,'Browser','2026-11-17 12:22:24.871'),('78566a58-a78d-4956-8010-638eca6c2ba0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:13:17.423'),('78db588f-920c-4bb6-bc67-2f4d92932795','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039987408926,75.82869392068201,129,'Browser','2026-11-16 09:21:53.113'),('792311db-5ce6-4e2d-89b0-ad76e1d0ecd6','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 10:40:05.064'),('7924390d-a732-452c-b577-93632ee72589','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903925192314,75.82867794681789,129,'Browser','2026-11-16 12:50:01.508'),('7a600559-7799-46fb-8f62-d37bc8ef88f2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:40:49.673'),('7aed2889-6a0a-47de-b762-0844bc0f7c51','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:13:17.405'),('7b2f942c-dc89-4d1c-a672-49f93006f994','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.459'),('7c993081-bd63-4a3f-9308-0dc7e3c768ff','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:04:15.932'),('7d690f4c-b568-4f75-a943-e217ac427899','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:02:10.979'),('7eaeab58-6b19-4790-91a0-69382f80bb04','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.412'),('84dbc486-d863-49b1-a4f8-5c8d73c279fa','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:46:46.927'),('8630cb71-82e4-4c1c-804c-a6d8f68809fb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040254635451,75.82869342196523,129,'Browser','2026-11-16 13:13:56.057'),('86544360-ae49-4049-acae-cf2eba40cfd9','48285691-ec0c-4c20-bbae-7007670ca096','default-org-id',22.69038554989087,75.82869573703684,119,'Browser','2026-11-17 10:00:09.656'),('8660e14a-f2f6-42fd-97b0-c471002f6869','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038383454169,75.8287015042338,129,'Browser','2026-11-17 12:21:07.164'),('88016f08-5d76-4845-8a67-a4d278d2e607','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040066123424,75.82869374597722,122,'Browser','2026-11-17 04:55:05.515'),('8803058a-8a7c-41e3-afb5-0da24bd7fc75','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.356'),('893752d3-222e-46f9-a28f-a69fda184a22','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:59:33.314'),('895fdf86-4d9f-4138-ae54-a13a0538d955','48285691-ec0c-4c20-bbae-7007670ca096','default-org-id',22.69038554989087,75.82869573703684,119,'Browser','2026-11-17 10:00:09.654'),('8a675791-63d1-488b-b077-59955d406e1d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036989696587,75.82870893707666,122,'Browser','2026-11-17 07:07:13.351'),('8b60c9d5-cc8d-4c3d-86bb-1824875db6ca','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037512024896,75.82870277844741,126,'Browser','2026-11-18 07:24:55.520'),('8b675337-c6d1-4c21-a301-3a0ed97f79cf','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:21:20.529'),('8bfd129d-2103-4f4b-867e-a86b06cafecd','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.575'),('8d5fb4d8-4490-40e6-bf28-18d8927d9c9e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.567'),('8e0ad202-6660-4fb3-b66a-f090ffa1f230','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:18:05.791'),('900a7d1a-099c-4841-9342-70996236275d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.484'),('90418a60-fcee-475d-9e0a-1cc14feec95c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:39:53.801'),('90ae88ab-961b-450f-8359-1ff0a6b9a614','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:57:25.126'),('917dcd60-0fba-4e6e-94cc-bc125f905158','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.771'),('91bfa2a8-b68a-48cb-a681-c68d6459d361','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036752606578,75.82870317755803,129,'Browser','2026-11-17 06:57:59.303'),('92efde6f-733c-4aad-a091-4cee6cee7716','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:22:52.038'),('9393a412-df72-4537-b357-f15f1c6d758c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:28:17.909'),('93a3d84f-c2ea-408d-8093-a99ef7f449b0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034053710791,75.82860239772329,125,'Browser','2026-11-16 10:05:29.040'),('93f3955e-143f-493a-a4c8-b1abec272d25','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.545'),('95236e7b-01c1-419b-9f98-069d62790295','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:39:19.976'),('953dff0f-50ac-4887-a146-d9e374ee4eaa','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040024301261,75.82867648481644,129,'Browser','2026-11-16 12:26:42.878'),('96895b01-f81e-4439-b551-21b53b1f9170','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.435'),('96a900df-09ee-4c75-b5ca-7a75e2bce75d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:20:54.571'),('96ee1a18-78c1-40d5-b059-16228f62f10a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:41:28.038'),('96fb95de-811f-4a41-a8ca-4d491e71d82e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039317672386,75.82869369040255,119,'Browser','2026-11-16 10:10:10.759'),('99bed7f0-c3ba-4509-8786-3b034a2745b8','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036988198127,75.82861344382664,121,'Browser','2026-11-16 13:19:37.747'),('9af986fb-0418-4a31-8356-9a04f3d22a7b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:22:52.044'),('9b7184f9-9767-4757-8e0f-557056f43195','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:12:06.459'),('9c606775-b903-4a78-b71f-1cb9f3031aa6','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69047380985332,75.82870787096405,135,'Browser','2026-11-17 09:17:35.155'),('9c8c4506-094f-4078-a2f4-02a1a2b463c1','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037955620757,75.82868253935939,119,'Browser','2026-11-17 04:53:09.073'),('9df3b7e7-773e-48d9-8fee-b4d305287d13','656bfb4e-4f15-4da2-bc93-16d57b5b2093','b27957c7-9430-450b-ab74-9f86dbdaec02',22.69037168411504,75.82870197286842,122,'Browser','2026-11-18 06:58:59.484'),('9e0c09dd-0a68-4a47-a727-98c99d05b6bd','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:22:52.038'),('9e0e1f32-95a0-46d7-a89c-5eacecc27e35','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.544'),('9e1820ae-4b62-48b4-9d00-f8962963f5af','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038035720835,75.82870906261152,142,'Browser','2026-11-17 07:34:16.771'),('9ed8c95d-97c6-45ed-8722-de4ce9640351','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037603723399,75.82868573956141,129,'Browser','2026-11-16 12:46:59.082'),('9f2224b2-19cc-4ee7-84b2-f209f02200d7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:33:02.008'),('a02ae57e-bb4c-42b1-98b4-c57429e7f1b2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,50000,'Browser','2026-05-23 11:45:27.647'),('a04d1328-02ed-4bb8-8a4c-a5daee435c0d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.476'),('a085337c-d326-4247-af8f-71933769bfa7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038201994893,75.82870354660072,114,'Browser','2026-11-16 12:49:36.371'),('a0aeb718-e395-4426-8651-b7eaa4a09ca9','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:13:04.217'),('a24da2f8-2f18-4148-8723-abdbf94b2fca','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.770'),('a276cb91-2bd1-488a-971a-870bdbb21aca','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042187391566,75.828690511429,126,'Browser','2026-11-17 12:20:31.419'),('a29090f5-5f0a-4882-aad6-8b097b4fdf78','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:34:13.770'),('a4bf49a8-4323-48d7-b9f8-9a35101ec514','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039265326727,75.82869377322821,119,'Browser','2026-11-17 06:37:53.908'),('a601c281-8f14-4d4d-96e0-8d29c2afde05','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038580782307,75.82870401450184,129,'Browser','2026-11-17 07:39:38.198'),('a60b4762-8f1f-4f9e-a9e0-4bbcbe6bde5b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040066123424,75.82869374597722,122,'Browser','2026-11-17 05:07:20.076'),('a6a51766-adf8-475c-9932-fab1a3c0480e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,50000,'Browser','2026-05-23 11:11:53.206'),('a7272840-672f-4912-9b62-ebcb4a35730f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:54:56.174'),('ab5f5f3a-1ead-4ea4-9a31-b30236e86184','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.649'),('abb0d4b6-8ee4-4f12-8990-25d181fbe77b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039317672386,75.82869369040255,119,'Browser','2026-11-16 10:10:10.732'),('abe87dc6-afdc-4246-b1c4-93c2ed5d7398','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903998773809,75.82867746595956,129,'Browser','2026-11-17 05:59:51.956'),('ac32429f-749e-4fa3-945d-354fa3038f14','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69067245502778,75.82883140704635,124,'Browser','2026-11-18 05:11:21.671'),('ad9f8258-ce7b-4246-b625-dd58a9151ebf','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:39:45.800'),('b05fdc95-05f6-4e57-9047-bbf45dbb3ad5','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:20:54.571'),('b069b035-66d2-4b69-95e9-904c0fead3aa','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69058991915069,75.82877916240675,119,'Browser','2026-11-17 12:21:24.981'),('b0bf46f1-e81a-4b50-a67b-8b3f8f47e39c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042867323267,75.82871482170836,129,'Browser','2026-11-17 05:38:14.647'),('b0ce3bae-a42f-4bf5-ab3a-c25a9dff1fce','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040066123424,75.82869374597722,122,'Browser','2026-11-17 05:04:06.194'),('b1acb6ed-65c9-4f66-9c5d-84972d595d9b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69067245502778,75.82883140704635,124,'Browser','2026-11-18 05:11:21.671'),('b3376b2a-516a-499c-8177-08b75f16c4d1','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:54:56.174'),('b4c23942-e179-492f-87d1-554c83bf9cb4','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037512024896,75.82870277844741,126,'Browser','2026-11-18 07:21:13.181'),('b4d8c4cf-9a8b-4fdf-afda-d62f981dc4f0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903925192314,75.82867794681789,129,'Browser','2026-11-16 12:22:42.127'),('b55f15be-8a48-42a2-8782-ab2be22ca43b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69071183441115,75.8288241722921,116,'Browser','2026-11-17 10:45:56.926'),('b6646df3-9273-40b9-a943-9584ae8e2995','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.178'),('b79a568e-6eb2-4cf4-b794-cad60618451f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:20:54.571'),('b876858a-8d04-4648-ac7a-45b7f5fca6e5','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037014939266,75.8286877608048,126,'Browser','2026-11-17 05:42:58.524'),('b8f10610-e10e-4268-a559-5f71420a78ec','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:20:57.624'),('b91c9843-5723-4d86-a167-1cbd0d33754d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:04:15.932'),('b97dc427-e825-499f-8e54-2913f93f3499','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040254635451,75.82869342196523,129,'Browser','2026-11-16 13:13:56.051'),('b9a186f3-21f0-4922-87b3-045720396351','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.812'),('ba4ebea7-4674-4966-8bdc-f52e98a7b1db','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037955620757,75.82868253935939,119,'Browser','2026-11-17 04:53:09.083'),('ba6ed8fb-d22a-4c4e-9c4c-2037775eaee3','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037955620757,75.82868253935939,119,'Browser','2026-11-17 04:53:09.073'),('bb247283-de86-4912-afa8-f05f35c56876','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038580782307,75.82870401450184,129,'Browser','2026-11-17 07:39:38.200'),('bca4ca92-0279-454c-89b8-78bcf208e6cf','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:18.556'),('bccbbfe1-147d-4535-89b8-4811567700d8','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037014939266,75.8286877608048,126,'Browser','2026-11-17 05:42:58.524'),('be538cc2-746f-4b68-b38b-892f50dc6c2d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041970893548,75.82869087111051,129,'Browser','2026-11-17 09:26:40.223'),('c02cd26f-13d4-4667-a77a-1a6ea39fcfe7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:09:57.089'),('c0a9f7f9-f964-43b3-b6fe-d5ce14e52318','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036988198127,75.82861344382664,121,'Browser','2026-11-16 13:19:37.786'),('c14d6b0a-1880-40f1-98c9-38f3a6c4e739','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69067245502778,75.82883140704635,124,'Browser','2026-11-18 05:11:28.723'),('c2222fbe-f8de-41eb-8f6f-cc17c60320b2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:21:20.529'),('c53175ca-d91a-4b42-a78d-4b6f117dae51','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:21:20.529'),('c564020c-08f7-485e-9047-16ed22375b7d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:39:45.137'),('c64bf9ae-7ab9-4235-90b9-8e2a1397630d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903925192314,75.82867794681789,129,'Browser','2026-11-16 12:21:46.495'),('c716734a-8e0a-4c76-aa56-1e2982d1cd19','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040254635451,75.82869342196523,129,'Browser','2026-11-16 13:13:56.078'),('c7869e4e-3f74-4ead-bc3d-a1090b55d50e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:09:06.253'),('c7930b58-6e37-4e03-b16b-baf5bd268812','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041795414045,75.82877399829877,155,'Browser','2026-11-17 09:59:30.988'),('c8956f27-4bdc-412a-9015-8d2f4d88f0e7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.125'),('cb9e53d2-0ebb-4d4e-afff-06b6f9e8d587','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042867323267,75.82871482170836,129,'Browser','2026-11-17 05:34:22.543'),('cd8989bb-a10e-4ed1-aa54-a84e313c156f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 10:38:08.116'),('ceda2b4c-2e72-484c-8af7-7f0a5e131cc2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.099'),('d0cc19d3-b478-4033-9a03-9191edc9d0b9','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040024301261,75.82867648481644,129,'Browser','2026-11-16 12:26:42.897'),('d1e3bde2-b85f-4066-8540-6e8077fe88d6','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69057009047464,75.82878551418727,119,'Browser','2026-11-18 05:12:00.078'),('d1e5565a-c0bb-4f58-a061-462b7eef84f9','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041970893548,75.82869087111051,129,'Browser','2026-11-17 09:26:40.225'),('d1ea9de0-200b-4073-8952-7a9978d392d8','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:19:41.592'),('d2ba050d-3dcc-472a-b512-48a153158c3c','656bfb4e-4f15-4da2-bc93-16d57b5b2093','b27957c7-9430-450b-ab74-9f86dbdaec02',22.69037168411504,75.82870197286842,122,'Browser','2026-11-18 06:58:59.484'),('d47eeba3-d2b6-4012-8113-8627a96fafe9','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.650'),('d482ffe5-8d2c-40ed-8ffb-832d994d10b7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.812'),('d579f1fa-d594-4751-ade8-afbf87f7faae','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:13:04.232'),('d66d1306-71a2-4ba7-89bd-abaacb4e2068','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040254635451,75.82869342196523,129,'Browser','2026-11-16 13:13:56.083'),('d6f7e9a0-aa79-49c2-9da5-eb610c44489a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036988198127,75.82861344382664,121,'Browser','2026-11-16 13:19:37.742'),('d804acff-5319-4485-9425-1f7472bdabe0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:54.592'),('d928cc8e-0ac4-458c-8760-5e7f2052d645','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040066123424,75.82869374597722,122,'Browser','2026-11-17 05:04:06.194'),('d93fcee9-9174-40cf-a677-121e5a60e1dc','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038383454169,75.8287015042338,129,'Browser','2026-11-17 12:21:07.162'),('d9581857-7a4b-422a-b234-070f91968451','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.484'),('d9c66799-a2e6-4273-94a7-c5eb1afdb83a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038201994893,75.82870354660072,114,'Browser','2026-11-16 11:18:57.834'),('da7697ce-21ff-4772-ac50-05b17b34cc65','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 10:40:05.063'),('daa39a69-92b0-4014-aebc-6f28e5802a2a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034053710791,75.82860239772329,125,'Browser','2026-11-16 10:05:29.040'),('dbba80b9-e943-4636-adf3-44b3a7622f31','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69067245502778,75.82883140704635,124,'Browser','2026-11-18 05:06:47.839'),('dbc3659c-6785-40ab-8105-18cf8804357a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:39:45.144'),('dd7223f6-25a6-4e0b-8942-d8be6727ff06','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903998773809,75.82867746595956,129,'Browser','2026-11-17 05:48:18.823'),('dde83de1-2277-4e69-962c-303d77ca2ecb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:29:23.435'),('de959c51-9bc2-4ec7-8051-39f421903282','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69058991915069,75.82877916240675,119,'Browser','2026-11-17 12:24:32.956'),('dfd71674-3ca8-46ee-8039-bb35012c57bb','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038580782307,75.82870401450184,129,'Browser','2026-11-17 07:40:16.608'),('e087d071-7c79-46c6-b379-509a66693f24','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:39:19.975'),('e0ab5464-0dad-44a7-81b5-428c35f101c4','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69067245502778,75.82883140704635,124,'Browser','2026-11-18 05:05:47.924'),('e1ec5145-9682-4630-9660-f2c3a79239d7','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038587951414,75.8287040826938,139,'Browser','2026-11-16 11:02:35.945'),('e1fe816f-2f65-4131-8ba7-c48b914285ca','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039317672386,75.82869369040255,119,'Browser','2026-11-16 10:10:10.728'),('e2b1552b-99bb-4590-a401-2833ef72d181','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:33:02.004'),('e31d1668-7700-490e-b693-cb4c0eaaa314','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:54.592'),('e44c0578-58c0-42b1-b342-951ed9e33a51','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037512024896,75.82870277844741,126,'Browser','2026-11-18 07:21:13.181'),('e4b9a439-919b-4684-8d1c-4dc7b7a384cf','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.488'),('e56a184b-06b1-4375-a3e5-45131a8efd73','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.567'),('e611ea82-b612-4564-b1b1-bce3a494f60b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,50000,'Browser','2026-05-23 11:45:27.645'),('e67cb254-1914-4cc0-9996-9b192357d64c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:18.556'),('e7582262-1deb-441d-9e2c-87ffddac1f88','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903998773809,75.82867746595956,129,'Browser','2026-11-17 05:48:18.822'),('e8d97710-7092-451a-8c83-eef96f0a254c','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:21:20.529'),('ea570bf1-121d-4776-aa45-e43b665181c5','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69042187391566,75.828690511429,126,'Browser','2026-11-17 12:19:48.149'),('ea95a33a-a1c5-4e48-98e1-60ba25cd77af','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.351'),('ebc4c069-a9b9-499d-bdc0-65bb172442fd','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:19:41.592'),('ebc52fa0-1e85-4122-a6f9-35d773e39910','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903998773809,75.82867746595956,129,'Browser','2026-11-17 05:48:18.822'),('ebf3de24-0c9a-48bb-9fc7-94ae9a014139','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:33:02.007'),('ee2eb070-f95e-47ef-8dbd-e5a081256cb2','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038587951414,75.8287040826938,139,'Browser','2026-11-16 11:04:41.466'),('eee556be-6b66-4121-841f-926353036381','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:19:41.593'),('ef198ee7-8d13-482b-b634-e9ca60899ed9','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69037745603936,75.82869672873085,113,'Browser','2026-11-16 06:10:18.442'),('f07eb084-1540-4cdd-bfd4-ca86677ae4bc','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:09:06.253'),('f0c36fff-5b52-473a-a65c-3c987185e974','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036988198127,75.82861344382664,121,'Browser','2026-11-16 13:19:37.742'),('f1157a4e-6e3c-45ac-a54f-8bf8d2d53227','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038201994893,75.82870354660069,114,'Browser','2026-11-16 12:48:37.835'),('f13ae00c-bb34-4a83-b8b0-fd0644802173','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041970893548,75.82869087111051,129,'Browser','2026-11-17 09:26:40.225'),('f27a3362-49eb-4758-98fb-bca91b57fd20','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:34:09.968'),('f30be7de-9369-48fb-8c15-ca34b85169ad','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69040024301261,75.82867648481644,129,'Browser','2026-11-16 12:26:42.878'),('f48adec6-6f4e-4a89-80a2-127b0303d3fe','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:45:51.356'),('f49c7423-2884-40c8-a4af-37648492e758','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:09:06.254'),('f64c1696-8f12-462f-b905-3922ce3ebc03','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.541'),('f6f868c9-d4b1-4a10-8b03-1dd92006d8c0','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 11:57:25.127'),('f7220261-3506-41f2-9622-8e9a5943d50f','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:12:15.544'),('f8e11ab5-6147-4e3a-8068-4da239c45f8b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69041131950735,75.82867437141743,129,'Browser','2026-11-17 05:31:45.770'),('f9d76888-3beb-46ac-b4fe-ae45ea083e2a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69034743446798,75.8287094902261,116,'Browser','2026-11-16 11:18:25.205'),('fa3153ba-3e81-4823-8a43-7a4b5f92ca13','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69038744513762,75.82869536365867,119,'Browser','2026-11-16 12:11:59.522'),('fc9354b5-405a-4c7b-a448-819f1b6690b1','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:27:22.468'),('fcb291a3-3c75-4dbc-92aa-519fe41dfe6b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6903930157602,75.8287003871608,129,'Browser','2026-11-16 12:34:13.772'),('fd60bf08-27fa-4871-ae39-d5ad7dfa1029','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69036989696587,75.82870893707666,122,'Browser','2026-11-17 07:07:13.272'),('fe390864-efd8-4fc0-9d44-1d79580598a3','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039987408926,75.82869392068201,129,'Browser','2026-11-16 09:19:16.185'),('fe3afe8c-84bf-4609-b9f0-b2bec7cb163e','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.6988,75.8611,2000,'Browser','2026-04-06 12:41:28.069'),('ff2e2f94-dd6d-4284-ba75-7b0f1061fe5d','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id',22.69039459942501,75.82870163371754,120,'Browser','2026-11-17 11:13:17.394');
/*!40000 ALTER TABLE `location_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `locations` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'Office',
  `address` varchar(191) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `threshold` int(11) NOT NULL DEFAULT 4,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `locations_organizationId_fkey` (`organizationId`),
  CONSTRAINT `locations_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manual_time_entries`
--

DROP TABLE IF EXISTS `manual_time_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `manual_time_entries` (
  `id` varchar(191) NOT NULL,
  `startTime` datetime(3) NOT NULL,
  `endTime` datetime(3) NOT NULL,
  `timezone` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL,
  `duration` int(11) NOT NULL,
  `note` text DEFAULT NULL,
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `manual_time_entries_employeeId_fkey` (`employeeId`),
  KEY `manual_time_entries_organizationId_fkey` (`organizationId`),
  CONSTRAINT `manual_time_entries_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `manual_time_entries_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manual_time_entries`
--

LOCK TABLES `manual_time_entries` WRITE;
/*!40000 ALTER TABLE `manual_time_entries` DISABLE KEYS */;
INSERT INTO `manual_time_entries` VALUES ('021801fb-e36b-4718-b9f6-c47793f0c540','2026-07-07 23:00:00.000','2026-07-07 23:52:55.000',NULL,'Work',3175,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:33.762','2026-07-25 07:26:33.762'),('02c27f84-34f8-4667-be39-25633a2de805','2026-07-20 23:00:00.000','2026-07-20 23:58:41.000',NULL,'Work',3521,'Client consultation and strategy review','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:37.677','2026-07-25 07:26:37.677'),('06845009-3756-47fa-acd2-52175f973969','2026-06-28 23:00:00.000','2026-06-28 23:45:03.000',NULL,'Work',2703,'Sprint planning alignment meeting','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:30.799','2026-07-25 07:26:30.799'),('06c88276-db18-449d-869e-0787e90be5bb','2026-07-14 23:00:00.000','2026-07-14 23:35:05.000',NULL,'Work',2105,'Client consultation and strategy review','163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:35.597','2026-07-25 07:26:35.597'),('0fe8bbdd-26e2-4eb9-85af-c805dfc5f7f7','2026-07-02 23:00:00.000','2026-07-02 23:57:00.000',NULL,'Work',3420,'Client consultation and strategy review','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:32.522','2026-07-25 07:26:32.522'),('1cd73b7c-54ab-4c7f-a5aa-953791b52bf1','2026-07-15 23:00:00.000','2026-07-15 23:44:41.000',NULL,'Work',2681,'Sprint planning alignment meeting','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:36.389','2026-07-25 07:26:36.389'),('1de35900-8881-47d9-aa95-fd4843e9208d','2026-07-17 23:00:00.000','2026-07-17 23:48:38.000',NULL,'Work',2918,'Sprint planning alignment meeting','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:37.106','2026-07-25 07:26:37.106'),('1e61e04a-11ed-455e-a7cf-f9838bbd5e99','2026-07-03 23:00:00.000','2026-07-03 23:41:49.000',NULL,'Work',2509,'Client consultation and strategy review','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:32.763','2026-07-25 07:26:32.763'),('2735d03f-fde3-44ba-afe9-0b544149a380','2026-07-14 23:00:00.000','2026-07-14 23:36:04.000',NULL,'Work',2164,'Client consultation and strategy review','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:35.789','2026-07-25 07:26:35.789'),('2c86b813-dd9a-4f1b-b37b-f05ab0fe2a68','2026-07-09 23:00:00.000','2026-07-09 23:52:55.000',NULL,'Work',3175,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:34.462','2026-07-25 07:26:34.462'),('31d087b9-ebb6-4712-b25e-ee3eb0544ffa','2026-07-08 23:00:00.000','2026-07-08 23:42:50.000',NULL,'Work',2570,'Client consultation and strategy review','163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:33.884','2026-07-25 07:26:33.884'),('35b4c3bc-c38c-40a8-a872-7ae2f606c458','2026-07-09 23:00:00.000','2026-07-09 23:56:16.000',NULL,'Work',3376,'Sprint planning alignment meeting','48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:34.286','2026-07-25 07:26:34.286'),('3e76825e-da87-4a94-b1dd-d54f31507fdf','2026-07-06 23:00:00.000','2026-07-06 23:52:55.000',NULL,'Work',3175,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:33.335','2026-07-25 07:26:33.335'),('50e905b0-e281-401f-8092-7303f81c23bc','2026-06-30 23:00:00.000','2026-06-30 23:55:15.000',NULL,'Work',3315,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:31.614','2026-07-25 07:26:31.614'),('6109e52f-8ee2-4573-b674-ab563b5834dd','2026-07-16 23:00:00.000','2026-07-16 23:35:05.000',NULL,'Work',2105,'Client consultation and strategy review','163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:36.451','2026-07-25 07:26:36.451'),('6d2a1dec-194b-4171-81e2-6aa53de51124','2026-07-02 23:00:00.000','2026-07-02 23:46:09.000',NULL,'Work',2769,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:32.457','2026-07-25 07:26:32.457'),('6e1d904b-a38f-4ce5-8deb-fde41e05f21d','2026-07-13 23:00:00.000','2026-07-13 23:30:52.000',NULL,'Work',1852,'Client consultation and strategy review','48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:35.222','2026-07-25 07:26:35.222'),('7da70a2e-3aa9-4e64-adaa-773d4bd4669a','2026-07-24 23:00:00.000','2026-07-24 23:52:45.000',NULL,'Work',3165,'Client consultation and strategy review','48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:38.918','2026-07-25 07:26:38.918'),('883f9fbb-87e2-4cfb-ad64-23fac7cae5e3','2026-07-08 23:00:00.000','2026-07-08 23:58:12.000',NULL,'Work',3492,'Sprint planning alignment meeting','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:34.171','2026-07-25 07:26:34.171'),('9644bf5c-bea9-40a5-be63-8f2e588436cf','2026-07-23 23:00:00.000','2026-07-23 23:36:05.000',NULL,'Work',2165,'Sprint planning alignment meeting','163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:38.549','2026-07-25 07:26:38.549'),('98f9c28d-be6d-4b44-8bc5-b24315d02245','2026-07-01 23:00:00.000','2026-07-01 23:41:49.000',NULL,'Work',2509,'Client consultation and strategy review','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:31.961','2026-07-25 07:26:31.961'),('9d32a824-13d1-4421-ac0f-3b026c681a68','2026-06-27 23:00:00.000','2026-06-27 23:45:03.000',NULL,'Work',2703,'Sprint planning alignment meeting','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:30.661','2026-07-25 07:26:30.661'),('a7a1434c-d4dd-41b0-b621-8d9fc260e71a','2026-07-21 23:00:00.000','2026-07-21 23:46:29.000',NULL,'Work',2789,'Client consultation and strategy review','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:38.129','2026-07-25 07:26:38.129'),('ac0e7b48-3d43-43d8-9f1a-5d7987fde8c7','2026-07-15 23:00:00.000','2026-07-15 23:30:52.000',NULL,'Work',1852,'Client consultation and strategy review','48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:36.057','2026-07-25 07:26:36.057'),('af098805-09af-4c71-89af-7afcbcc406dc','2026-06-29 23:00:00.000','2026-06-29 23:30:03.000',NULL,'Work',1803,'Sprint planning alignment meeting','48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:30.982','2026-07-25 07:26:30.982'),('b2c780e4-8050-4811-bc5f-5a4eb279b3bb','2026-07-01 23:00:00.000','2026-07-01 23:46:09.000',NULL,'Work',2769,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:32.088','2026-07-25 07:26:32.088'),('be736c24-03f9-4bb0-b5f5-199ee7ac8d14','2026-07-07 23:00:00.000','2026-07-07 23:42:50.000',NULL,'Work',2570,'Client consultation and strategy review','163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:33.503','2026-07-25 07:26:33.503'),('c1f98a04-a07f-423c-b2d2-ec8f9d680588','2026-06-29 23:00:00.000','2026-06-29 23:45:03.000',NULL,'Work',2703,'Sprint planning alignment meeting','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:31.271','2026-07-25 07:26:31.271'),('ce004e44-20ac-44a7-8f4b-7114026c2960','2026-07-03 23:00:00.000','2026-07-03 23:37:41.000',NULL,'Work',2261,'Sprint planning alignment meeting','163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:32.580','2026-07-25 07:26:32.580'),('d10f56ab-7640-438c-8348-70982c14e509','2026-07-10 23:00:00.000','2026-07-10 23:33:36.000',NULL,'Work',2016,'Client consultation and strategy review','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:34.828','2026-07-25 07:26:34.828'),('d35295f9-db25-4786-884f-21c1a0f62561','2026-07-05 23:00:00.000','2026-07-05 23:52:55.000',NULL,'Work',3175,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:32.938','2026-07-25 07:26:32.938'),('dc4c637c-bf79-4c64-8351-b233ae8f8173','2026-07-08 23:00:00.000','2026-07-08 23:45:03.000',NULL,'Work',2703,'Sprint planning alignment meeting','48285691-ec0c-4c20-bbae-7007670ca096','default-org-id','2026-07-25 07:26:33.950','2026-07-25 07:26:33.950'),('e1769b7a-3df6-4d77-a818-9cc6129e903f','2026-06-26 23:00:00.000','2026-06-26 23:42:30.000',NULL,'Work',2550,'Sprint planning alignment meeting','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:30.481','2026-07-25 07:26:30.481'),('e2281b84-cb19-4943-98ec-9e61607f0a53','2026-07-03 23:00:00.000','2026-07-03 23:52:55.000',NULL,'Work',3175,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:32.820','2026-07-25 07:26:32.820'),('edf251b1-e1cc-473e-97bb-4c5f2489ad86','2026-07-23 23:00:00.000','2026-07-23 23:46:29.000',NULL,'Work',2789,'Client consultation and strategy review','dec4a6b8-c082-4ce2-b525-3b7a545317ee','default-org-id','2026-07-25 07:26:38.747','2026-07-25 07:26:38.747'),('f0f83a26-dc52-4f6d-a103-b24f433aa50e','2026-07-20 23:00:00.000','2026-07-20 23:50:46.000',NULL,'Work',3046,'Client consultation and strategy review','c4553f00-3292-4798-8fc6-74737b0c7fa1','default-org-id','2026-07-25 07:26:37.736','2026-07-25 07:26:37.736'),('f0fa04da-859a-4dd5-be48-201e9410427f','2026-07-13 23:00:00.000','2026-07-13 23:49:06.000',NULL,'Work',2946,'Sprint planning alignment meeting','163aad68-68d7-4a05-b820-86f9e86710f4','default-org-id','2026-07-25 07:26:35.160','2026-07-25 07:26:35.160'),('fe1b42f2-cd8f-47fe-b132-af97eb4a9886','2026-07-21 23:00:00.000','2026-07-21 23:37:26.000',NULL,'Work',2246,'Client consultation and strategy review','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-07-25 07:26:38.007','2026-07-25 07:26:38.007');
/*!40000 ALTER TABLE `manual_time_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `targetUserId` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'info',
  `unread` tinyint(1) NOT NULL DEFAULT 1,
  `link` varchar(191) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_organizationId_unread_createdAt_idx` (`organizationId`,`unread`,`createdAt`),
  CONSTRAINT `notifications_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organizations` (
  `id` varchar(191) NOT NULL,
  `legalName` varchar(191) NOT NULL,
  `workspaceId` varchar(191) NOT NULL,
  `industry` varchar(191) DEFAULT NULL,
  `organizationSize` varchar(191) DEFAULT NULL,
  `timeZone` varchar(191) NOT NULL DEFAULT 'UTC',
  `workStartTime` varchar(191) NOT NULL DEFAULT '09:00',
  `workEndTime` varchar(191) NOT NULL DEFAULT '18:00',
  `workDays` varchar(191) NOT NULL DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organizations_workspaceId_key` (`workspaceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES ('b27957c7-9430-450b-ab74-9f86dbdaec02','admin','9e4218a3-9e70-44e8-a6f9-479ba55b50d9',NULL,NULL,'UTC+5:30 (IST)','09:00','18:00','Monday,Tuesday,Wednesday,Thursday,Friday','2026-05-27 07:46:31.929','2026-05-27 07:46:31.929'),('default-org-id','Insightful Corp','222a8b91-1405-4fb2-8ed9-7dc985280cb9','Technology','11-50 employees','UTC+5:30 (IST)','09:00','18:00','Monday,Tuesday,Wednesday,Thursday,Friday','2026-04-04 13:37:21.438','2026-04-04 13:37:21.438');
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_records`
--

DROP TABLE IF EXISTS `payroll_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payroll_records` (
  `id` varchar(191) NOT NULL,
  `totalHours` double NOT NULL DEFAULT 0,
  `amount` double NOT NULL DEFAULT 0,
  `status` enum('PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
  `employeeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `payroll_records_employeeId_fkey` (`employeeId`),
  CONSTRAINT `payroll_records_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_records`
--

LOCK TABLES `payroll_records` WRITE;
/*!40000 ALTER TABLE `payroll_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `payroll_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productivity_rules`
--

DROP TABLE IF EXISTS `productivity_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productivity_rules` (
  `id` varchar(191) NOT NULL,
  `appName` varchar(191) DEFAULT NULL,
  `domain` varchar(191) NOT NULL,
  `productivity` enum('PRODUCTIVE','NEUTRAL','UNPRODUCTIVE') NOT NULL DEFAULT 'NEUTRAL',
  `category` varchar(191) DEFAULT 'Uncategorized',
  `tagId` varchar(191) DEFAULT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `isBlocked` tinyint(1) NOT NULL DEFAULT 0,
  `teamId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `productivity_rules_organizationId_domain_teamId_key` (`organizationId`,`domain`,`teamId`),
  KEY `productivity_rules_tagId_fkey` (`tagId`),
  KEY `idx_productivity_rules_org` (`organizationId`),
  KEY `productivity_rules_teamId_fkey` (`teamId`),
  CONSTRAINT `productivity_rules_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `productivity_rules_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `productivity_tags` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `productivity_rules_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productivity_rules`
--

LOCK TABLES `productivity_rules` WRITE;
/*!40000 ALTER TABLE `productivity_rules` DISABLE KEYS */;
INSERT INTO `productivity_rules` VALUES ('03bd0cac-833e-4521-a713-8ae8b8cba04f','YouTube','youtube','UNPRODUCTIVE','Uncategorized',NULL,'default-org-id','2026-07-24 12:09:48.959','2026-07-24 13:22:21.637',1,NULL),('21b157bd-6b85-4b31-aa6e-74064e2f1faf','explorer','explorer','NEUTRAL','Uncategorized','a4e62448-61fb-4936-8dd8-9c6f4c8a5f3c','default-org-id','2026-05-23 11:40:43.033','2026-05-23 11:40:43.033',0,NULL),('27f48f9c-ef18-4438-a66b-7383325b3bf7','ScreenClippingHost','screenclippinghost','NEUTRAL','Uncategorized','a4e62448-61fb-4936-8dd8-9c6f4c8a5f3c','default-org-id','2026-05-23 11:40:43.069','2026-05-23 11:40:43.069',0,NULL),('47035f78-682a-41cb-8fda-bff58d46e873','facebook.com','facebook.com','UNPRODUCTIVE','Uncategorized',NULL,'default-org-id','2026-07-24 13:59:29.530','2026-07-24 14:10:43.857',1,NULL),('8c69e25a-14ac-425b-adc2-84eafd8e8c13','instagram.com','instagram.com','UNPRODUCTIVE','Uncategorized',NULL,'default-org-id','2026-07-24 14:12:17.619','2026-07-24 14:12:17.619',1,NULL),('a2138d8f-b6f9-4fe7-a715-a672fb9ceaf2','Terminal','terminal','PRODUCTIVE','Development','a8072147-c502-4dce-abba-c55ea80d8ccd','default-org-id','2026-05-23 11:40:10.582','2026-05-23 11:42:17.969',0,NULL),('c2d04f9f-99d2-4728-b057-1a7748d2f873','electron','electron','PRODUCTIVE','Uncategorized','a8072147-c502-4dce-abba-c55ea80d8ccd','default-org-id','2026-05-23 11:40:29.071','2026-05-23 11:40:29.071',0,NULL),('cb30982d-add0-4738-80bf-b898942f397b','Cursor','cursor.sh','PRODUCTIVE','Development','a8072147-c502-4dce-abba-c55ea80d8ccd','default-org-id','2026-05-23 11:40:10.558','2026-05-23 11:42:17.944',0,NULL);
/*!40000 ALTER TABLE `productivity_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productivity_tags`
--

DROP TABLE IF EXISTS `productivity_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productivity_tags` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `color` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `productivity_tags_organizationId_fkey` (`organizationId`),
  CONSTRAINT `productivity_tags_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productivity_tags`
--

LOCK TABLES `productivity_tags` WRITE;
/*!40000 ALTER TABLE `productivity_tags` DISABLE KEYS */;
INSERT INTO `productivity_tags` VALUES ('402ded41-a516-4e66-8b18-f8bf09ab0ab5','Collaborative','#69C0FF','b27957c7-9430-450b-ab74-9f86dbdaec02','2026-06-02 05:23:01.937','2026-06-02 05:23:01.937'),('68685436-683b-4547-8ce4-4d82237ab84b','Distraction','#FF4D4F','default-org-id','2026-05-23 11:36:15.085','2026-05-23 11:36:15.085'),('a4e62448-61fb-4936-8dd8-9c6f4c8a5f3c','Collaborative','#69C0FF','default-org-id','2026-05-23 11:36:15.079','2026-05-23 11:36:15.079'),('a8072147-c502-4dce-abba-c55ea80d8ccd','Focus','#9254DE','default-org-id','2026-05-23 11:36:15.074','2026-05-23 11:36:15.074'),('d55cb342-d7dd-4aca-97ce-2ed98c7aad9f','Focus','#9254DE','b27957c7-9430-450b-ab74-9f86dbdaec02','2026-06-02 05:23:01.917','2026-06-02 05:23:01.917'),('e8047580-0412-4245-a7d9-c3f0006f42ac','Learning','#52C41A','default-org-id','2026-05-23 11:36:15.082','2026-05-23 11:36:15.082'),('ea4750ea-b510-4ab3-adf1-479c79dd33b0','Learning','#52C41A','b27957c7-9430-450b-ab74-9f86dbdaec02','2026-06-02 05:23:01.942','2026-06-02 05:23:01.942'),('f10f40c0-c709-43d0-9b05-4d943f0afbe3','Distraction','#FF4D4F','b27957c7-9430-450b-ab74-9f86dbdaec02','2026-06-02 05:23:01.950','2026-06-02 05:23:01.950');
/*!40000 ALTER TABLE `productivity_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_assignments`
--

DROP TABLE IF EXISTS `project_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_assignments` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_assignments_projectId_employeeId_key` (`projectId`,`employeeId`),
  KEY `project_assignments_employeeId_fkey` (`employeeId`),
  CONSTRAINT `project_assignments_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `project_assignments_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_assignments`
--

LOCK TABLES `project_assignments` WRITE;
/*!40000 ALTER TABLE `project_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_time_logs`
--

DROP TABLE IF EXISTS `project_time_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_time_logs` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `duration` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `loggedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `ptl_project_id_fkey` (`projectId`),
  KEY `ptl_employee_id_fkey` (`employeeId`),
  CONSTRAINT `ptl_employee_id_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ptl_project_id_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_time_logs`
--

LOCK TABLES `project_time_logs` WRITE;
/*!40000 ALTER TABLE `project_time_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_time_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `billableRate` double NOT NULL DEFAULT 0,
  `budget` double NOT NULL DEFAULT 0,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `projects_organizationId_fkey` (`organizationId`),
  CONSTRAINT `projects_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES ('6a4e13b5-4ef3-4055-ab1f-2368ce786160','insight ful','kajsdjfkaj',100,200,'default-org-id','2026-04-06 12:47:45.750','2026-04-06 12:47:45.750'),('b41f80c0-5f48-4939-9703-7ce9ecbade2a','employee monitoring','tracking system',100,10000,'default-org-id','2026-04-04 13:39:13.616','2026-04-04 13:39:13.616'),('e8b18c02-e2c9-4361-a95a-f2cacbd99119','project1','djd sajdnwikd jqk',6,32,'b27957c7-9430-450b-ab74-9f86dbdaec02','2026-11-17 12:57:30.713','2026-11-17 12:57:30.713');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_settings`
--

DROP TABLE IF EXISTS `report_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `report_settings` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `workloadOptimalFrom` int(11) NOT NULL DEFAULT 60,
  `workloadOptimalTo` int(11) NOT NULL DEFAULT 85,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_settings_organizationId_key` (`organizationId`),
  CONSTRAINT `report_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_settings`
--

LOCK TABLES `report_settings` WRITE;
/*!40000 ALTER TABLE `report_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `screenshot_settings`
--

DROP TABLE IF EXISTS `screenshot_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `screenshot_settings` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `randomShifts` tinyint(1) NOT NULL DEFAULT 0,
  `excludeAdmin` tinyint(1) NOT NULL DEFAULT 1,
  `globalBlur` tinyint(1) NOT NULL DEFAULT 0,
  `frequency` int(11) NOT NULL DEFAULT 5,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `screenshot_settings_organizationId_key` (`organizationId`),
  CONSTRAINT `screenshot_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `screenshot_settings`
--

LOCK TABLES `screenshot_settings` WRITE;
/*!40000 ALTER TABLE `screenshot_settings` DISABLE KEYS */;
INSERT INTO `screenshot_settings` VALUES ('31dbef19-705a-466d-b99e-340c00c66bd6','b27957c7-9430-450b-ab74-9f86dbdaec02',0,1,0,5,'2026-05-27 07:46:41.364','2026-05-27 07:46:41.364'),('68c8168b-1ffe-4fcb-85fb-a7f35dce7ed2','default-org-id',0,1,0,5,'2026-04-04 13:38:05.951','2026-06-02 06:29:47.428');
/*!40000 ALTER TABLE `screenshot_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `screenshots`
--

DROP TABLE IF EXISTS `screenshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `screenshots` (
  `id` varchar(191) NOT NULL,
  `imageUrl` longtext NOT NULL,
  `productivity` enum('PRODUCTIVE','NEUTRAL','UNPRODUCTIVE') NOT NULL DEFAULT 'NEUTRAL',
  `blurred` tinyint(1) NOT NULL DEFAULT 0,
  `deletedByEmployee` tinyint(1) NOT NULL DEFAULT 0,
  `capturedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `screenshots_employeeId_fkey` (`employeeId`),
  KEY `screenshots_organizationId_fkey` (`organizationId`),
  CONSTRAINT `screenshots_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `screenshots_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `screenshots`
--

LOCK TABLES `screenshots` WRITE;
/*!40000 ALTER TABLE `screenshots` DISABLE KEYS */;
/*!40000 ALTER TABLE `screenshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shifts` (
  `id` varchar(191) NOT NULL,
  `startTime` varchar(191) NOT NULL,
  `endTime` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `shifts_employeeId_fkey` (`employeeId`),
  KEY `shifts_organizationId_fkey` (`organizationId`),
  CONSTRAINT `shifts_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `shifts_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_time_logs`
--

DROP TABLE IF EXISTS `task_time_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `task_time_logs` (
  `id` varchar(191) NOT NULL,
  `taskId` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `startTime` datetime(3) NOT NULL,
  `endTime` datetime(3) DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT 0,
  `isRunning` tinyint(1) NOT NULL DEFAULT 1,
  `source` varchar(191) NOT NULL DEFAULT 'WEB',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `task_time_logs_employeeId_isRunning_idx` (`employeeId`,`isRunning`),
  KEY `task_time_logs_taskId_idx` (`taskId`),
  KEY `task_time_logs_organizationId_idx` (`organizationId`),
  CONSTRAINT `task_time_logs_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `task_time_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `task_time_logs_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_time_logs`
--

LOCK TABLES `task_time_logs` WRITE;
/*!40000 ALTER TABLE `task_time_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_time_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tasks` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `status` enum('BACKLOG','IN_OPERATIONS','QUALITY_ASSURANCE','FINALIZED') NOT NULL DEFAULT 'BACKLOG',
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `dueDate` datetime(3) DEFAULT NULL,
  `projectId` varchar(191) NOT NULL,
  `employeeId` varchar(191) DEFAULT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_projectId_fkey` (`projectId`),
  KEY `tasks_employeeId_fkey` (`employeeId`),
  KEY `tasks_organizationId_fkey` (`organizationId`),
  CONSTRAINT `tasks_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tasks_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `tasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES ('1bc5c690-ed42-44cb-accb-a5489cf8b211','kdfjgl','FINALIZED','MEDIUM','2026-02-12 00:00:00.000','b41f80c0-5f48-4939-9703-7ce9ecbade2a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-04-06 10:45:16.862','2026-04-06 12:46:32.296'),('2a685155-4ece-4e16-803e-9eaaa4797037','jghjhhjkhkj','BACKLOG','MEDIUM','2026-01-23 00:00:00.000','6a4e13b5-4ef3-4055-ab1f-2368ce786160',NULL,'default-org-id','2026-05-23 11:11:46.670','2026-05-23 13:13:24.678'),('3e0a04dc-cd2b-440f-9cc3-f0385fa86375','insight ','IN_OPERATIONS','MEDIUM','2026-12-12 00:00:00.000','6a4e13b5-4ef3-4055-ab1f-2368ce786160',NULL,'default-org-id','2026-04-06 12:48:25.752','2026-07-25 01:31:49.303'),('559b7ec3-c7cd-4b37-be35-f07f43047c79','task','FINALIZED','MEDIUM','2026-11-16 00:00:00.000','e8b18c02-e2c9-4361-a95a-f2cacbd99119','f91283ce-1bc8-4c4b-95f1-0637b2e997fd','b27957c7-9430-450b-ab74-9f86dbdaec02','2026-11-17 12:58:19.721','2026-11-18 06:12:13.792'),('765e9400-b307-4dc6-9112-e707aa7628be','abc','BACKLOG','MEDIUM','2026-11-16 00:00:00.000','6a4e13b5-4ef3-4055-ab1f-2368ce786160','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-11-16 12:13:55.979','2026-11-16 12:13:55.979'),('80acc53a-8a02-4b92-8d65-76e424e5f3de','employee tracking','BACKLOG','MEDIUM','2026-12-12 00:00:00.000','b41f80c0-5f48-4939-9703-7ce9ecbade2a','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','2026-04-04 13:39:38.291','2026-04-04 13:39:38.291');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teams` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `color` varchar(191) DEFAULT 'bg-blue-500',
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `teams_organizationId_fkey` (`organizationId`),
  CONSTRAINT `teams_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES ('b742f8a2-1328-4727-9cc3-8a3c1ed133a7','kiaan team','asdfghjk erfgbhnjmk','bg-blue-500','default-org-id','2026-11-17 10:27:55.658','2026-11-17 10:38:13.723'),('default-team-id','Development Team',NULL,'bg-blue-500','default-org-id','2026-04-04 13:37:21.467','2026-04-04 13:37:21.467'),('e27d6e38-63d7-478a-b9f5-3eeb09c4e8a6','it team','handle coding ','bg-blue-500','default-org-id','2026-04-04 13:38:49.499','2026-04-04 13:38:49.499');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `time_offs`
--

DROP TABLE IF EXISTS `time_offs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `time_offs` (
  `id` varchar(191) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `type` varchar(191) NOT NULL,
  `timeOffType` varchar(191) DEFAULT NULL,
  `timezone` varchar(191) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `singleDay` tinyint(1) NOT NULL DEFAULT 0,
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `time_offs_employeeId_fkey` (`employeeId`),
  KEY `time_offs_organizationId_fkey` (`organizationId`),
  CONSTRAINT `time_offs_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `time_offs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time_offs`
--

LOCK TABLES `time_offs` WRITE;
/*!40000 ALTER TABLE `time_offs` DISABLE KEYS */;
/*!40000 ALTER TABLE `time_offs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timesheet_approvals`
--

DROP TABLE IF EXISTS `timesheet_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `timesheet_approvals` (
  `id` varchar(191) NOT NULL,
  `timesheetId` varchar(191) NOT NULL,
  `approverId` varchar(191) NOT NULL,
  `approverName` varchar(191) NOT NULL,
  `decision` varchar(191) NOT NULL,
  `comment` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `timesheet_approvals_timesheetId_idx` (`timesheetId`),
  CONSTRAINT `timesheet_approvals_timesheetId_fkey` FOREIGN KEY (`timesheetId`) REFERENCES `timesheets` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timesheet_approvals`
--

LOCK TABLES `timesheet_approvals` WRITE;
/*!40000 ALTER TABLE `timesheet_approvals` DISABLE KEYS */;
INSERT INTO `timesheet_approvals` VALUES ('c18845b9-16ec-48b1-8d31-e590fd13b105','1b75a7a6-9048-4c99-8439-53bbf5237c4d','48285691-ec0c-4c20-bbae-7007670ca096','Administrator','APPROVED','Approved','2026-11-17 09:17:55.225');
/*!40000 ALTER TABLE `timesheet_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timesheets`
--

DROP TABLE IF EXISTS `timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `timesheets` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `weekStart` varchar(191) NOT NULL,
  `status` enum('DRAFT','SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
  `submittedAt` datetime(3) DEFAULT NULL,
  `totalMinutes` int(11) NOT NULL DEFAULT 0,
  `regularMinutes` int(11) NOT NULL DEFAULT 0,
  `overtimeMinutes` int(11) NOT NULL DEFAULT 0,
  `totalPay` double NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `timesheets_organizationId_employeeId_weekStart_key` (`organizationId`,`employeeId`,`weekStart`),
  KEY `timesheets_organizationId_weekStart_idx` (`organizationId`,`weekStart`),
  KEY `timesheets_employeeId_weekStart_idx` (`employeeId`,`weekStart`),
  CONSTRAINT `timesheets_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `timesheets_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timesheets`
--

LOCK TABLES `timesheets` WRITE;
/*!40000 ALTER TABLE `timesheets` DISABLE KEYS */;
INSERT INTO `timesheets` VALUES ('1b75a7a6-9048-4c99-8439-53bbf5237c4d','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','2026-11-16','APPROVED','2026-11-17 09:17:40.184',158,158,0,0,'2026-11-16 11:02:38.135','2026-11-17 09:17:55.225'),('21e384dc-663e-4d66-a164-bfdf7c8f1598','default-org-id','dec4a6b8-c082-4ce2-b525-3b7a545317ee','2026-11-16','DRAFT',NULL,0,0,0,0,'2026-11-16 11:19:20.131','2026-11-18 07:34:06.985'),('3f62d8e2-08c4-4751-8e5c-6326c5d22ac5','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','2026-11-16','DRAFT',NULL,100,100,0,0,'2026-11-16 11:19:20.132','2026-11-18 07:34:06.984'),('485a3076-d16d-444e-9430-4c0751922879','default-org-id','dec4a6b8-c082-4ce2-b525-3b7a545317ee','2026-11-23','DRAFT',NULL,0,0,0,0,'2026-11-17 10:33:53.319','2026-11-17 10:33:53.319'),('51fab4fb-9fc6-4151-bbd8-bbd97bda42cc','default-org-id','b93a4d90-2454-4694-8edd-dcbb7e408098','2026-11-23','DRAFT',NULL,0,0,0,0,'2026-11-17 10:33:53.318','2026-11-17 10:33:53.318'),('52b28c4e-af80-4852-826d-60793f8e4f7b','b27957c7-9430-450b-ab74-9f86dbdaec02','c4553f00-3292-4798-8fc6-74737b0c7fa1','2026-11-16','DRAFT',NULL,0,0,0,0,'2026-11-17 12:27:26.829','2026-11-18 07:00:08.461'),('53d9baec-c2c1-4150-891b-9bb723a7aeaf','default-org-id','163aad68-68d7-4a05-b820-86f9e86710f4','2026-11-23','DRAFT',NULL,0,0,0,0,'2026-11-17 10:33:53.318','2026-11-17 10:33:53.318'),('66d3cb52-1d4d-4f2e-8bd9-2908339b9b75','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','2026-11-16','DRAFT',NULL,0,0,0,0,'2026-11-16 11:19:20.131','2026-11-18 07:34:06.985'),('9f769e3d-e96d-410a-b260-55cb4d41942c','default-org-id','48285691-ec0c-4c20-bbae-7007670ca096','2026-11-23','DRAFT',NULL,0,0,0,0,'2026-11-17 10:33:53.317','2026-11-17 10:33:53.317'),('b70f7e82-8ec8-4059-87aa-19c248260685','b27957c7-9430-450b-ab74-9f86dbdaec02','656bfb4e-4f15-4da2-bc93-16d57b5b2093','2026-11-16','DRAFT',NULL,1,1,0,1.42,'2026-11-18 04:55:50.951','2026-11-18 07:00:08.462'),('fe9efe84-f198-495b-9d16-ec9e917ae7be','b27957c7-9430-450b-ab74-9f86dbdaec02','f91283ce-1bc8-4c4b-95f1-0637b2e997fd','2026-11-16','DRAFT',NULL,0,0,0,0,'2026-11-17 12:27:26.830','2026-11-18 07:00:08.460');
/*!40000 ALTER TABLE `timesheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tracking_data`
--

DROP TABLE IF EXISTS `tracking_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tracking_data` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `screenshotUrl` longtext DEFAULT NULL,
  `videoUrl` longtext DEFAULT NULL,
  `activityStatus` varchar(191) DEFAULT NULL,
  `location` varchar(191) DEFAULT NULL,
  `source` varchar(191) NOT NULL DEFAULT 'AGENT',
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `tracking_data_employeeId_fkey` (`employeeId`),
  CONSTRAINT `tracking_data_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tracking_data`
--

LOCK TABLES `tracking_data` WRITE;
/*!40000 ALTER TABLE `tracking_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `tracking_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tracking_settings`
--

DROP TABLE IF EXISTS `tracking_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tracking_settings` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `computerType` varchar(191) NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `visibility` varchar(191) NOT NULL DEFAULT 'visible',
  `screenshotsPerHour` int(11) NOT NULL DEFAULT 0,
  `allowAccessScreenshots` tinyint(1) NOT NULL DEFAULT 0,
  `allowRemoveScreenshots` tinyint(1) NOT NULL DEFAULT 0,
  `breakTime` int(11) NOT NULL DEFAULT 0,
  `allowOverBreak` tinyint(1) NOT NULL DEFAULT 0,
  `allowNewBreaks` tinyint(1) NOT NULL DEFAULT 0,
  `idleTime` int(11) NOT NULL DEFAULT 2,
  `trackingScenario` varchar(191) NOT NULL DEFAULT 'unlimited',
  `workingDays` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`workingDays`)),
  `trackTasks` tinyint(1) NOT NULL DEFAULT 0,
  `allowAddTasks` tinyint(1) NOT NULL DEFAULT 0,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `organizationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tracking_settings_organizationId_fkey` (`organizationId`),
  CONSTRAINT `tracking_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tracking_settings`
--

LOCK TABLES `tracking_settings` WRITE;
/*!40000 ALTER TABLE `tracking_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `tracking_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('ADMIN','MANAGER','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  `name` varchar(191) DEFAULT NULL,
  `avatar` text DEFAULT NULL,
  `employeeId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_employeeId_key` (`employeeId`),
  CONSTRAINT `users_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('37b7324c-4467-4efd-9c96-200a9125d4cc','admin@example.com','$2b$10$GF6v6zkqe7Cui5LlkM6zbumPoGzbjmgkTrRCNSDjZVg4d2okGGXem','ADMIN',NULL,NULL,'48285691-ec0c-4c20-bbae-7007670ca096','2026-04-04 13:37:21.570','2026-11-18 07:11:35.066'),('49bf700c-f0a1-4c82-809c-7cabdfd9777b','test@example.com','$2b$10$7K4DQmyrYoTH62YOLVXa9unZbtnDuXrz3pQqtKcOfzgcQQVzPWTz2','EMPLOYEE',NULL,NULL,'dec4a6b8-c082-4ce2-b525-3b7a545317ee','2026-05-22 14:09:34.387','2026-05-22 14:09:34.387'),('5330f956-f5b1-4bc0-9fa6-59ff255a568a','manager@example.com','$2b$10$GF6v6zkqe7Cui5LlkM6zbumPoGzbjmgkTrRCNSDjZVg4d2okGGXem','MANAGER',NULL,NULL,'163aad68-68d7-4a05-b820-86f9e86710f4','2026-04-04 13:37:21.584','2026-11-18 07:11:35.074'),('5b345bb6-530c-4eca-8801-bea4ca87357f','employee@example.com','$2b$10$GF6v6zkqe7Cui5LlkM6zbumPoGzbjmgkTrRCNSDjZVg4d2okGGXem','EMPLOYEE',NULL,NULL,'b93a4d90-2454-4694-8edd-dcbb7e408098','2026-04-04 13:37:21.597','2026-11-18 07:11:35.081'),('76a4575d-7021-403f-86a4-10c11ad2ef3a','admin@gmail.com','$2b$10$x0RCIIaY/ngnMkkt2tbRL.jB8qp2sZPI2J4vVoybW3L4lk.5JMcrm','ADMIN','admin demo',NULL,'c4553f00-3292-4798-8fc6-74737b0c7fa1','2026-05-27 07:46:31.929','2026-05-27 07:46:31.929'),('834181ff-f041-4258-869a-db71b201ad87','employee@gmail.com','$2b$10$xAGwGeV/Oo8AJOVoCisFTu1.1gQJExGvksSW6BY140QRHUz/qAtWG','EMPLOYEE','employee1',NULL,'656bfb4e-4f15-4da2-bc93-16d57b5b2093','2026-11-17 13:36:06.126','2026-11-17 13:36:06.126');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_recordings`
--

DROP TABLE IF EXISTS `video_recordings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_recordings` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `fileUrl` longtext NOT NULL,
  `sizeMb` double DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `video_recordings_employeeId_fkey` (`employeeId`),
  KEY `video_recordings_organizationId_fkey` (`organizationId`),
  CONSTRAINT `video_recordings_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `video_recordings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_recordings`
--

LOCK TABLES `video_recordings` WRITE;
/*!40000 ALTER TABLE `video_recordings` DISABLE KEYS */;
INSERT INTO `video_recordings` VALUES ('79f39350-8316-4c87-aaf6-2ef80c1a2e7b','b93a4d90-2454-4694-8edd-dcbb7e408098','default-org-id','/uploads/videos/1794895295120-635274440.webm',4.77,'2026-11-17 06:01:35.155');
/*!40000 ALTER TABLE `video_recordings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_zones`
--

DROP TABLE IF EXISTS `work_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_zones` (
  `id` varchar(191) NOT NULL,
  `organizationId` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'Office',
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `radius` double NOT NULL DEFAULT 100,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `work_zones_organizationId_fkey` (`organizationId`),
  CONSTRAINT `work_zones_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_zones`
--

LOCK TABLES `work_zones` WRITE;
/*!40000 ALTER TABLE `work_zones` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_zones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'employee-monitering'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-18 13:10:55
