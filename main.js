$(document).ready(function() {
    
    var fileCount = 4;
    var fileProgress = 0;
    
    var loading = 0;
    var progress = $('#progress-loading-files');
    
    var teachers = {}; // props: fullName, firstName, lastName, email, courses[]
    var students = {}; // props: id, firstName, lastName, email
    var courses = {};  // props: students[], teacher
    
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
            courseList.append('<div id="' + course + '" onclick="listStudents(this.id);">' + teacher.courses[i] + '</div>');
        }
        $('#teacher').text(teacher.fullName);
    };
    
    var transition = function() {
        console.log(teachers);
        
        var email = 'flyngar@rockhursths.edu';
        listCourses(email);
    };
    
    // forcing string keys
    var cleanKeys = function(cat, key, term) {
        // category
        switch(cat) {
            case 'course':
                return 'c' + key.replace(' - ','_').trim() + 't' + term;
            case 'student':
                return 's' + key;
            case 'teacher':
                return '' + key;
        }
    };
    
    // combines all the data into one useful object
    var combine = function(data) {
        
        data = data.split('\n');
        var records = new Array(data.length - 1); // -1 bc burn the headers
        var header = data[0].split(',')[0];
                
        // branch by data
        switch(header) {
            case 'Full name':
                // teachers_by_email.csv
                console.log('teachers_by_email.csv');
                // from 1; first row has headers
                for(var i = 1; i < data.length; i++) {
                    if(data[i].length > 0) {
                        records[i] = data[i].split(',');
                        var key = cleanKeys('teacher', records[i][0]); // Full name
                        var firstName = records[i][2];
                        var lastName = records[i][3];
                        var email = records[i][4].toLowerCase();
                        if(!teachers.hasOwnProperty(key)) {
                            teachers[key] = {}
                            teachers[key].courses = [];
                        }
                        teachers[key].fullName = key;
                        teachers[key].firstName = firstName;
                        teachers[key].lastName = lastName;
                        teachers[key].email = email;
                    }
                }
                break;
            case 'Room ID':
                // teachers_by_class.csv
                console.log('teachers_by_class.csv');
                // from 1; first row has headers
                for(var i = 1; i < data.length; i++) {
                    if(data[i].length > 0) {
                        records[i] = data[i].split(',');
                        var term = records[i][4];
                        var key = cleanKeys('course', records[i][5], term); // Class ID
                        var teacherKey = cleanKeys('teacher', records[i][2]);
                        if(!courses.hasOwnProperty(key)) {
                            courses[key] = {}
                            courses[key].students = [];
                            courses[key].teacher = teachers[teacherKey];
                            
                            // if the teacher doesn't already exist, create it
                            if(!teachers.hasOwnProperty(teacherKey)) {
                                teachers[teacherKey] = {}
                                teachers[teacherKey].courses = [];
                            }
                            // add the course to the teacher
                            if(teachers[teacherKey].courses.indexOf(key) === -1) {
                                teachers[teacherKey].courses.push(key);
                            }
                        }
                    }
                }
                break;
            case 'StsSt_Lastname':
                // students_by_email.csv
                console.log('students_by_email.csv');
                // from 1; first row has headers
                for(var i = 1; i < data.length; i++) {
                    if(data[i].length > 0) {
                        records[i] = data[i].split(',');
                        var key = cleanKeys('student', records[i][5]).toString(); // StsSt_StudentID
                        var firstName = records[i][1];
                        var lastName = records[i][0];
                        var email = records[i][8].toLowerCase();
                        if(!students.hasOwnProperty(key)) {
                            students[key] = {};
                        }
                        students[key].id = records[i][5]; // without the 's'
                        students[key].firstName = firstName;
                        students[key].lastName = lastName;
                        students[key].email = email;
                    }
                }
                break;
            case 'Class ID':
                // students_by_class.csv
                console.log('students_by_class.csv');
                // from 1; first row has headers
                for(var i = 1; i < data.length; i++) {
                    if(data[i].length > 0) {
                        records[i] = data[i].split(',');
                        var key = cleanKeys('student', records[i][8]).toString(); // Student ID
                        var term = records[i][1];
                        var courseKey = cleanKeys('course', records[i][0], term); // Class ID
                        var courseName = records[i][4];
                        
                        // if student doesn't exist
                        if(!students.hasOwnProperty(key)) {
                            students[key] = {};
                        }
                        
                        // add the student to the course
                        if(!courses.hasOwnProperty(courseKey)) {
                            courses[courseKey] = {};
                            courses[courseKey].students = [];
                        }
                        if(courses[courseKey].students.indexOf(key) === -1) {
                            courses[courseKey].students.push(key);
                        }
                    }
                }
                break;
        }

        // update progress bar
        loading += 25;
        progress.attr('value', loading);
        
        // finished processing data files
        if (++fileProgress === fileCount) {
            transition();
        }
    };

  
    
    // get the data from the files
    $.get('data/teachers_by_email.csv', function(data) {
        combine(data);
    });
    
    $.get('data/teachers_by_class.csv', function(data) {
        combine(data);
    });

    $.get('data/students_by_email.csv', function(data) {
        combine(data);
    });

    $.get('data/students_by_class.csv', function(data) {
        combine(data);
    });
    
    window.listStudents = function(id) {
        var course = courses[id];
        var studentList = $('#studentsInCourse');
        studentList.html('');
        
        var html = '<tr><th>Last Name</th><th>First Name</th><th>Student ID</th><th>Email</th></tr>';
        console.log(students);
        console.log(teachers);
        console.log(courses);
    };

});