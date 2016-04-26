$(document).ready(function() {
    
    var tbyc, tbye, sbyc, sbye;
    
    var totalFiles = 4;
    var parsedFiles = 0;
    
    var progress = 0; // progress on the progress bar
    var progressBar = $('#progress-loading-files'); // the progress bar
    
    var courses = {};
    var students = {};
    var teachers = {};
    
    window.listStudents = function(id) {
        var course = courses[id];
        var studentList = $('#students');
        studentList.html('');
        
        var html = '<tr><th>Last Name</th><th>First Name</th><th>Student ID</th><th>Email</th></tr>';
        for(var i = 0; i < course.roster.length; i++) {
            var studentID = parseInt(course.roster[i]);
            var student = students[studentID];
            html += '<tr><td>' + student.lname + '</td><td>' + student.fname + '</td><td>' + student.id + '</td><td>' + student.email + '</td></tr>';
        }
        studentList.append(html);
    };
    
    var listCourses = function(email) {
        var teacher;
        for(var prop in teachers) {
            if(teachers.hasOwnProperty(prop)) {
                if(teachers[prop].email === email) {
                    teacher = teachers[prop];
                }
            }
        }
        
        var courseList = $('#courses');
        for(var i = 0; i < teacher.courses.length; i++) {
            var course = teacher.courses[i];
            courseList.append('<div id="' + course + '" onclick="listStudents(this.id);">' + course + '</div>');
        }
    };
        
    var next = function() {
        console.log('next');
        console.log(students);
        console.log(courses);
        console.log(teachers);
        
        var email = 'flyngar@rockhursths.edu';
        listCourses(email);
    };
    
    var updateProgress = function() {
        progress += 12.5;
        progressBar.attr('value', progress);
    };
    
    var courseKey = function(id, term) {
        return id.replace(' - ', '_').trim() + 't' + term;
    };
    
    var parseTeachersByCourse = function(data) {
        console.log('tbyc');
        data = data.split('\n');
        for(var i = 1; i < data.length; i++) {
            if(data[i].length > 0) {
                var csv = data[i].split(',');
                var courseID = csv[5];
                var courseTerm = csv[4];
                var teacherID = csv[2];
                courseID = courseKey(courseID, courseTerm);
                
                if(teachers[teacherID].courses.indexOf(courseID) === -1) {
                    teachers[teacherID].courses.push(courseID);
                }
            }
        }
    };
    
    var parseTeachersByEmail = function(data) {
        console.log('tbye');
        data = data.split('\n');
        for(var i = 1; i < data.length; i++) {
            if(data[i].length > 0) {
                var csv = data[i].split(',');
                var teacherID = csv[0];
                var teacherEmail = csv[4].toLowerCase();
                var teacher = {
                    id: teacherID,
                    email: teacherEmail,
                    courses: []
                };
                if(!teachers.hasOwnProperty(teacherID)) {
                    teachers[teacherID] = teacher;
                }
            }
        }
    };
    
    var parseStudentsByEmail = function(data) {
        console.log('sbye');
        data = data.split('\n');
        for(var i = 1; i < data.length; i++) {
            if(data[i].length > 0) {
                var csv = data[i].split(',');
                var student = {
                    lname: csv[0],
                    fname: csv[1],
                    grade: csv[2],
                    id: csv[5],
                    email: csv[8]
                };
                students[student.id] = student;
            }
        }
    };
    
    var parseStudentsByCourse = function(data) {
        console.log('sbyc');
        data = data.split('\n');
        for(var i = 1; i < data.length; i++) {
            if(data[i].length > 0) {
                var csv = data[i].split(',');
                var studentID = csv[8];
                var course;
                var courseID = csv[0];
                var courseTerm = csv[1];
                var courseName = csv[4];
                courseID = courseKey(courseID, courseTerm);
                
                if(!courses.hasOwnProperty(courseID)) {
                    course = {
                        id: courseID,
                        name: courseName,
                        roster: []
                    };
                    courses[courseID] = course;
                } else {
                    course = courses[courseID];
                }
                if(course.roster.indexOf(studentID) === -1) {
                    course.roster.push(studentID);
                }
            }
        }
    };
    
    var handleParse = function() {
        parsedFiles++;
        updateProgress();
        
        if(parsedFiles === totalFiles) {
            
            try {
                parseStudentsByCourse(sbyc);
                updateProgress();
            } catch(ex) {
                if(ex instanceof TypeError) {
                    console.log('parseStudentsByCourse typeerror');
                }
            }
            
            try {
                parseStudentsByEmail(sbye);
                updateProgress();
            } catch(ex) {
                if(ex instanceof TypeError) {
                    console.log('parseStudentsByEmail typeerror');
                }
            }
            
            try {
                parseTeachersByEmail(tbye);
                updateProgress();
            } catch(ex) {
                if(ex instanceof TypeError) {
                    console.log('parseTeachersByEmail typeerror');
                }
            }
            
            try {
                parseTeachersByCourse(tbyc);
                updateProgress();
            } catch(ex) {
                if(ex instanceof TypeError) {
                    console.log('parseTeachersByCourse typeerror');
                }
            }
            
            next();
        }
    };
        
    // get the data from the files
    $.get('data/teachers_by_email.csv', function(data) {
        tbye = data;
        handleParse();
    });
    
    $.get('data/teachers_by_class.csv', function(data) {
        tbyc = data;
        handleParse();
    });

    $.get('data/students_by_email.csv', function(data) {
        sbye = data;
        handleParse();
    });

    $.get('data/students_by_class.csv', function(data) {
        sbyc = data;
        handleParse();
    });
});